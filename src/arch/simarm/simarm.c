/*****************************************************************************
 * pce                                                                       *
 *****************************************************************************/

/*****************************************************************************
 * File name:     src/arch/simarm/simarm.c                                   *
 * Created:       2004-11-04 by Hampa Hug <hampa@hampa.ch>                   *
 * Last modified: 2004-11-09 by Hampa Hug <hampa@hampa.ch>                   *
 * Copyright:     (C) 2004 Hampa Hug <hampa@hampa.ch>                        *
 *****************************************************************************/

/*****************************************************************************
 * This program is free software. You can redistribute it and / or modify it *
 * under the terms of the GNU General Public License version 2 as  published *
 * by the Free Software Foundation.                                          *
 *                                                                           *
 * This program is distributed in the hope  that  it  will  be  useful,  but *
 * WITHOUT  ANY   WARRANTY,   without   even   the   implied   warranty   of *
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU  General *
 * Public License for more details.                                          *
 *****************************************************************************/

/* $Id$ */


#include "main.h"


void sarm_break (simarm_t *sim, unsigned char val);


static
void sarm_setup_ram (simarm_t *sim, ini_sct_t *ini)
{
  ini_sct_t     *sct;
  mem_blk_t     *ram;
  const char    *fname;
  unsigned long base, size;

  sct = ini_sct_find_sct (ini, "ram");

  while (sct != NULL) {
    fname = ini_get_str (sct, "file");
    base = ini_get_lng_def (sct, "base", 0);
    size = ini_get_lng_def (sct, "size", 16L * 1024L * 1024L);

    pce_log (MSG_INF, "RAM:\tbase=0x%08lx size=%lu file=%s\n",
      base, size, (fname == NULL) ? "<none>" : fname
    );

    ram = mem_blk_new (base, size, 1);
    mem_blk_clear (ram, 0x00);
    mem_blk_set_ro (ram, 0);
    mem_add_blk (sim->mem, ram, 1);

    if (fname != NULL) {
      if (pce_load_blk_bin (ram, fname)) {
        pce_log (MSG_ERR, "*** loading ram failed (%s)\n", fname);
      }
    }

    sct = ini_sct_find_next (sct, "ram");
  }
}

static
void sarm_setup_rom (simarm_t *sim, ini_sct_t *ini)
{
  ini_sct_t     *sct;
  mem_blk_t     *rom;
  const char    *fname;
  unsigned long base, size;

  sct = ini_sct_find_sct (ini, "rom");

  while (sct != NULL) {
    fname = ini_get_str (sct, "file");
    base = ini_get_lng_def (sct, "base", 0);
    size = ini_get_lng_def (sct, "size", 65536L);

    pce_log (MSG_INF, "ROM:\tbase=0x%08lx size=%lu file=%s\n",
      base, size, (fname != NULL) ? fname : "<none>"
    );

    rom = mem_blk_new (base, size, 1);
    mem_blk_clear (rom, 0x00);
    mem_blk_set_ro (rom, 1);
    mem_add_blk (sim->mem, rom, 1);

    if (fname != NULL) {
      if (pce_load_blk_bin (rom, fname)) {
        pce_log (MSG_ERR, "*** loading rom failed (%s)\n", fname);
      }
    }

    sct = ini_sct_find_next (sct, "rom");
  }
}

static
void sarm_setup_cpu (simarm_t *sim, ini_sct_t *ini)
{
  ini_sct_t  *sct;
  const char *model;

  sct = ini_sct_find_sct (ini, "cpu");

  model = ini_get_str_def (sct, "model", "armv5");

  pce_log (MSG_INF, "CPU:\tmodel=%s\n", model);

  sim->cpu = arm_new ();
  if (sim->cpu == NULL) {
    return;
  }

  arm_set_mem_fct (sim->cpu, sim->mem,
    &mem_get_uint8,
    &mem_get_uint16_le,
    &mem_get_uint32_le,
    &mem_set_uint8,
    &mem_set_uint16_le,
    &mem_set_uint32_le
  );
}

static
void sarm_setup_serport (simarm_t *sim, ini_sct_t *ini)
{
  unsigned      i;
  unsigned long base;
  unsigned      irq;
  const char    *fname;
  const char    *chip;
  ini_sct_t     *sct;

  static unsigned long defbase[4] = { 0xef600300UL, 0xef600400UL };
  static unsigned      defirq[4] = { 0, 1 };


  sim->serport[0] = NULL;
  sim->serport[1] = NULL;

  sct = ini_sct_find_sct (ini, "serial");
  if (sct == NULL) {
    return;
  }

  i = 0;
  while ((i < 2) && (sct != NULL)) {
    base = ini_get_lng_def (sct, "io", defbase[i]);
    irq = ini_get_lng_def (sct, "irq", defirq[i]);
    chip = ini_get_str_def (sct, "uart", "8250");
    fname = ini_get_str (sct, "file");

    pce_log (MSG_INF, "UART%u:\tio=0x%08lx irq=%u uart=%s file=%s\n",
      i, base, irq, chip, (fname == NULL) ? "<none>" : fname
    );

    sim->serport[i] = ser_new (base);
    if (sim->serport[i] == NULL) {
      pce_log (MSG_ERR, "*** serial port setup failed [%08lX/%u -> %s]\n",
        base, irq, (fname == NULL) ? "<none>" : fname
      );
    }
    else {
      if (fname != NULL) {
        if (ser_set_fname (sim->serport[i], fname)) {
          pce_log (MSG_ERR, "*** can't open file (%s)\n", fname);
        }
      }
      else {
        ser_set_fp (sim->serport[i], stdout, 0);
      }

      if (e8250_set_chip_str (&sim->serport[i]->uart, chip)) {
        pce_log (MSG_ERR, "*** unknown UART chip (%s)\n", chip);
      }

//      irqf = (e8250_irq_f) p405uic_get_irq_f (&sim->uic, irq);
//      e8250_set_irq_f (&sim->serport[i]->uart, irqf, &sim->uic);

      mem_add_blk (sim->mem, ser_get_reg (sim->serport[i]), 0);

      i += 1;
    }

    sct = ini_sct_find_next (sct, "serial");
  }
}

static
void sarm_load_mem (simarm_t *sim, ini_sct_t *ini)
{
  ini_sct_t  *sct;
  const char *fmt;
  const char *fname;

  sct = ini_sct_find_sct (ini, "load");

  while (sct != NULL) {
    fmt = ini_get_str_def (sct, "format", "binary");
    fname = ini_get_str (sct, "file");

    pce_log (MSG_INF, "Load:\tformat=%s file=%s\n",
      fmt, (fname != NULL) ? fname : "<none>"
    );

    if (strcmp (fmt, "ihex") == 0) {
      if (fname != NULL) {
        if (pce_load_mem_hex (sim->mem, fname)) {
          pce_log (MSG_ERR, "*** loading ihex failed (%s)\n", fname);
        }
      }
    }
    else if (strcmp (fmt, "binary") == 0) {
      unsigned long base;

      base = ini_get_lng_def (sct, "base", 0);

      if (fname != NULL) {
        if (pce_load_mem_bin (sim->mem, fname, base)) {
          pce_log (MSG_ERR, "*** loading binary failed (%s)\n", fname);
        }
      }
    }
    else {
      pce_log (MSG_ERR, "*** unknown format (%s)\n", fmt);
    }

    sct = ini_sct_find_next (sct, "load");
  }
}

simarm_t *sarm_new (ini_sct_t *ini)
{
  unsigned i;
  simarm_t *sim;

  sim = (simarm_t *) malloc (sizeof (simarm_t));
  if (sim == NULL) {
    return (NULL);
  }

  sim->brk = 0;
  sim->clk_cnt = 0;

  for (i = 0; i < 4; i++) {
    sim->clk_div[i] = 0;
  }

  sim->brkpt = NULL;

  sim->mem = mem_new();

  sarm_setup_ram (sim, ini);
  sarm_setup_rom (sim, ini);
  sarm_setup_cpu (sim, ini);
  sarm_setup_serport (sim, ini);

  sarm_load_mem (sim, ini);

  return (sim);
}

void sarm_del (simarm_t *sim)
{
  if (sim == NULL) {
    return;
  }

  ser_del (sim->serport[1]);
  ser_del (sim->serport[0]);

  arm_del (sim->cpu);

  mem_del (sim->mem);

  free (sim);
}

unsigned long long sarm_get_clkcnt (simarm_t *sim)
{
  return (sim->clk_cnt);
}

void sarm_break (simarm_t *sim, unsigned char val)
{
  if ((val == PCE_BRK_STOP) || (val == PCE_BRK_ABORT)) {
    sim->brk = val;
  }
}

void sarm_set_keycode (simarm_t *sim, unsigned char val)
{
  ser_receive (sim->serport[1], val);
}

void sarm_reset (simarm_t *sim)
{
  arm_reset (sim->cpu);
}

void sarm_clock (simarm_t *sim, unsigned n)
{
  if (sim->clk_div[0] >= 1024) {
    scon_check (sim);

    sim->clk_div[0] &= 1023;
  }

  arm_clock (sim->cpu, n);

  sim->clk_cnt += n;
  sim->clk_div[0] += n;
/*  sim->clk_div[1] += n; */
/*  sim->clk_div[2] += n; */
/*  sim->clk_div[3] += n; */
}

void sarm_set_msg (simarm_t *sim, const char *msg, const char *val)
{
  if (strcmp (msg, "break") == 0) {
    if (strcmp (val, "stop") == 0) {
      sim->brk = PCE_BRK_STOP;
      return;
    }
    else if (strcmp (val, "abort") == 0) {
      sim->brk = PCE_BRK_ABORT;
      return;
    }
  }

  pce_log (MSG_DEB, "msg (\"%s\", \"%s\")\n", msg, val);

  pce_log (MSG_INF, "unhandled message (\"%s\", \"%s\")\n", msg, val);
}