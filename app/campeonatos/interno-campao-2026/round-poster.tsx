"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getTeamFlagPath } from "@/components/championship/TeamFlag";
import type { Game } from "./public-dashboard";

export type PosterGame = Pick<Game, "id" | "round" | "order" | "scheduledAt" | "status" | "category" | "home" | "homeIcon" | "away" | "awayIcon">;
type PosterFormat = "whatsapp" | "feed" | "story";
type DayGroup = { key: string; label: string; games: PosterGame[] };

const timeZone = "America/Sao_Paulo";
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone, weekday: "long", day: "2-digit", month: "2-digit" });
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

function groupGames(games: PosterGame[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  const sorted = [...games].sort((a, b) => {
    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Number.POSITIVE_INFINITY;
    return dateA - dateB || a.order - b.order || a.home.localeCompare(b.home, "pt-BR");
  });
  for (const game of sorted) {
    const date = game.scheduledAt ? new Date(game.scheduledAt) : null;
    const validDate = date && Number.isFinite(date.getTime()) ? date : null;
    const key = validDate ? dateKeyFormatter.format(validDate) : "sem-data";
    const label = validDate ? dayFormatter.format(validDate).replace("-feira", "").replace(",", " ·").toLocaleUpperCase("pt-BR") : "DATA A DEFINIR";
    const group = groups.get(key) ?? { key, label, games: [] };
    group.games.push(game);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Não foi possível carregar ${path}.`));
    image.src = path;
  });
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number) {
  let currentSize = size;
  ctx.font = `800 ${currentSize}px Arial, sans-serif`;
  while (ctx.measureText(text).width > maxWidth && currentSize > 19) {
    currentSize -= 1;
    ctx.font = `800 ${currentSize}px Arial, sans-serif`;
  }
  return text;
}

async function drawPoster(canvas: HTMLCanvasElement, round: number, groups: DayGroup[], format: PosterFormat = "whatsapp") {
  const paths = new Set<string>(["/logo-clube-xv.png", "/banners/folder-rodada-estadio.png"]);
  for (const group of groups) for (const game of group.games) {
    const home = getTeamFlagPath(game.homeIcon);
    const away = getTeamFlagPath(game.awayIcon);
    if (home) paths.add(home);
    if (away) paths.add(away);
  }
  const images = new Map(await Promise.all([...paths].map(async (path) => [path, await loadImage(path)] as const)));
  const width = 1080;
  const headerHeight = 510;
  const groupHeight = 64;
  const rowHeight = 90;
  const footerHeight = 110;
  const height = headerHeight + groups.reduce((sum, group) => sum + groupHeight + group.games.length * rowHeight, 0) + footerHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível gerar a imagem neste navegador.");

  const background = images.get("/banners/folder-rodada-estadio.png")!;
  if (format === "whatsapp") { ctx.fillStyle = "#d5a824"; ctx.fillRect(0, 0, width, 12); }
  const logo = images.get("/logo-clube-xv.png");
  if (logo) { ctx.save(); ctx.beginPath(); ctx.arc(540, 105, 75, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(logo, 465, 30, 150, 150); ctx.restore(); }
  ctx.textAlign = "center";
  // Gold streaks frame the title without baking any wording into the artwork.
  ctx.fillStyle = "rgba(240,185,40,0.7)";
  for (let index = 0; index < 9; index++) {
    const streakY = 267 + index * 13;
    const inset = (index % 3) * 27;
    ctx.fillRect(85 + inset, streakY, 150 - inset, index % 2 ? 3 : 5);
    ctx.fillRect(845, streakY + 4, 150 - inset, index % 2 ? 5 : 3);
  }
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
  ctx.lineJoin = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#11100c";
  ctx.font = "italic 900 91px Impact, Arial Black, sans-serif"; ctx.strokeText("COPA DO", width / 2, 258); ctx.fillStyle = "#ffffff"; ctx.fillText("COPA DO", width / 2, 258);
  ctx.font = "italic 900 141px Impact, Arial Black, sans-serif"; ctx.strokeText("MUNDO", width / 2, 372);
  const goldTitle = ctx.createLinearGradient(0, 265, 0, 385); goldTitle.addColorStop(0, "#ffdf5a"); goldTitle.addColorStop(1, "#d98b00"); ctx.fillStyle = goldTitle; ctx.fillText("MUNDO", width / 2, 372);
  ctx.font = "italic 900 53px Impact, Arial Black, sans-serif"; ctx.strokeText("XV · 2026", width / 2, 420); ctx.fillStyle = "#ffffff"; ctx.fillText("XV · 2026", width / 2, 420); ctx.restore();
  ctx.fillStyle = "rgba(10,10,10,0.94)"; ctx.beginPath(); ctx.roundRect(260, 430, 560, 62, 14); ctx.fill();
  ctx.strokeStyle = "#e3b32e"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#e3b32e"; ctx.font = "900 28px Arial, sans-serif"; ctx.fillText("★", 305, 472); ctx.fillText("★", 775, 472);
  ctx.fillStyle = "#ffffff"; ctx.font = "italic 900 40px Impact, Arial Black, sans-serif"; ctx.fillText(`${round}ª RODADA`, width / 2, 474);
  let y = 550;
  for (const group of groups) {
    ctx.textAlign = "left"; ctx.font = "italic 900 31px Impact, Arial Black, sans-serif";
    const dayWidth = Math.min(620, Math.max(390, ctx.measureText(group.label).width + 105));
    ctx.fillStyle = "rgba(10,10,10,0.96)"; ctx.beginPath(); ctx.roundRect(45, y, dayWidth, 52, 9); ctx.fill();
    ctx.strokeStyle = "#e3b32e"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#f6c83d"; ctx.fillText(group.label, 70, y + 35, dayWidth - 45);
    ctx.fillStyle = "#e3b32e";
    for (let index = 0; index < 4; index++) ctx.fillRect(45 + dayWidth, y + 10 + index * 9, 70 - index * 13, 3);
    y += groupHeight;
    for (const game of group.games) {
      ctx.fillStyle = "#f8f8f6"; ctx.beginPath(); ctx.roundRect(45, y, 990, 80, 12); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.32)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#e3b32e"; ctx.beginPath(); ctx.roundRect(56, y + 12, 125, 56, 8); ctx.fill();
      const date = game.scheduledAt ? new Date(game.scheduledAt) : null;
      const time = date && Number.isFinite(date.getTime()) ? timeFormatter.format(date) : "--:--";
      ctx.fillStyle = "#2b2517"; ctx.textAlign = "center"; ctx.font = "900 27px Arial, sans-serif"; ctx.fillText(time, 118, y + 49);
      const homeFlag = getTeamFlagPath(game.homeIcon); const awayFlag = getTeamFlagPath(game.awayIcon);
      if (homeFlag && images.get(homeFlag)) ctx.drawImage(images.get(homeFlag)!, 195, y + 21, 54, 38);
      if (awayFlag && images.get(awayFlag)) ctx.drawImage(images.get(awayFlag)!, 959, y + 21, 54, 38);
      ctx.fillStyle = "#181818"; ctx.textAlign = "center"; fitText(ctx, game.home.toLocaleUpperCase("pt-BR"), 260, 30); ctx.fillText(game.home.toLocaleUpperCase("pt-BR"), 385, y + 50, 260);
      ctx.fillStyle = "#b88b19"; ctx.font = "900 36px Arial, sans-serif"; ctx.fillText("×", 565, y + 52);
      ctx.fillStyle = "#181818"; fitText(ctx, game.away.toLocaleUpperCase("pt-BR"), 300, 30); ctx.fillText(game.away.toLocaleUpperCase("pt-BR"), 765, y + 50, 300);
      y += rowHeight;
    }
  }
  ctx.textAlign = "center"; ctx.fillStyle = "#f4d26d"; ctx.font = "800 27px Arial, sans-serif"; ctx.fillText("CLUBE XV VERANISTAS", width / 2, y + 55);
  const foreground = document.createElement("canvas"); foreground.width = width; foreground.height = height;
  foreground.getContext("2d")?.drawImage(canvas, 0, 0);
  const outputHeight = format === "feed" ? 1350 : format === "story" ? 1920 : height;
  canvas.height = outputHeight;
  const output = canvas.getContext("2d");
  if (!output) throw new Error("Não foi possível gerar a imagem neste navegador.");
  output.drawImage(background, 0, 0, width, outputHeight);
  output.fillStyle = "rgba(0,0,0,0.25)"; output.fillRect(0, 0, width, outputHeight);
  const scale = Math.min(1, outputHeight / height);
  const scaledWidth = width * scale; const scaledHeight = height * scale;
  output.drawImage(foreground, (width - scaledWidth) / 2, (outputHeight - scaledHeight) / 2, scaledWidth, scaledHeight);
}

export function RoundPosterBanner({ matches, round }: { matches: PosterGame[]; round: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groups = useMemo(() => groupGames(matches.filter((game) => game.round === round && game.status !== "CANCELADO")), [matches, round]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !groups.length) return;
    let active = true;
    const buffer = document.createElement("canvas");
    drawPoster(buffer, round, groups).then(() => {
      if (!active) return;
      canvas.width = buffer.width; canvas.height = buffer.height;
      canvas.getContext("2d")?.drawImage(buffer, 0, 0);
    }).catch(() => { /* The regular banner remains available if the artwork cannot load. */ });
    return () => { active = false; };
  }, [round, groups]);
  return <canvas ref={canvasRef} role="img" aria-label={`Folder da ${round}ª rodada do Campão`} className="h-full w-full object-contain" />;
}

export function RoundPoster({ matches, initialRound }: { matches: PosterGame[]; initialRound: number }) {
  const rounds = useMemo(() => [...new Set(matches.filter((game) => game.status !== "CANCELADO").map((game) => game.round))].sort((a, b) => a - b), [matches]);
  const [round, setRound] = useState(() => rounds.includes(initialRound) ? initialRound : (rounds[0] ?? 1));
  const [format, setFormat] = useState<PosterFormat>("whatsapp");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const groups = useMemo(() => groupGames(matches.filter((game) => game.round === round && game.status !== "CANCELADO")), [matches, round]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !groups.length) return;
    let active = true;
    // Render into an off-screen canvas so an older asynchronous render cannot replace a newer choice.
    const buffer = document.createElement("canvas");
    drawPoster(buffer, round, groups, format).then(() => {
      if (!active) return;
      canvas.width = buffer.width; canvas.height = buffer.height;
      canvas.getContext("2d")?.drawImage(buffer, 0, 0);
      setState("ready");
    }).catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [round, groups, format]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || state !== "ready") return;
    canvas.toBlob((blob) => {
      if (!blob) { setState("error"); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `campao-2026-rodada-${round}-${format}.png`; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  function changeRound(value: number) { setState("loading"); setRound(value); }

  return <section className="grid gap-3 lg:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.3fr)] lg:items-start">
    <div className="xv-card"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#8B6914]">Copa do Mundo XV 2026</p><h2 className="mt-1 text-2xl font-black">Folder da rodada</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">Jogos do Adulto e do Master em uma imagem para compartilhar. Horários e confrontos seguem o cadastro do campeonato.</p><label htmlFor="poster-round" className="mt-5 block text-sm font-bold">Escolha a rodada</label><select id="poster-round" value={round} onChange={(event) => changeRound(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-[#D4D4D8] bg-white px-3 py-3 text-sm font-bold">{rounds.map((item) => <option key={item} value={item}>{item}ª rodada</option>)}</select><label htmlFor="poster-format" className="mt-4 block text-sm font-bold">Formato da imagem</label><select id="poster-format" value={format} onChange={(event) => { setState("loading"); setFormat(event.target.value as PosterFormat); }} className="mt-2 w-full rounded-xl border border-[#D4D4D8] bg-white px-3 py-3 text-sm font-bold"><option value="whatsapp">WhatsApp · imagem completa</option><option value="feed">Instagram · feed (4:5)</option><option value="story">Instagram · Stories (9:16)</option></select><button type="button" onClick={download} disabled={state !== "ready" || !groups.length} className="mt-4 w-full rounded-xl bg-[#B89020] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">Baixar folder em PNG</button>{state === "loading" && groups.length ? <p role="status" className="mt-3 text-sm text-[#6B7280]">Preparando a imagem…</p> : null}{state === "error" ? <p role="alert" className="mt-3 text-sm text-red-700">Não foi possível gerar a imagem. Atualize a página e tente novamente.</p> : null}<p className="mt-3 text-xs leading-5 text-[#6B7280]">Jogos cancelados não aparecem. Jogos sem data aparecem em “Data a definir”.</p></div>
    <div className="xv-card"><h3 className="mb-3 text-lg font-black">Prévia do folder</h3>{groups.length ? <><canvas ref={canvasRef} role="img" aria-label={`Folder da ${round}ª rodada, com jogos do Adulto e Master`} className="mx-auto block h-auto w-full max-w-[540px] rounded-xl bg-[#151515] shadow-md" /><div className="sr-only">{groups.map((group) => <section key={group.key}><h4>{group.label}</h4><ul>{group.games.map((game) => <li key={game.id}>{game.scheduledAt ? timeFormatter.format(new Date(game.scheduledAt)) : "Horário a definir"}: {game.home} contra {game.away} ({game.category === "MASTER" ? "Master" : "Adulto"})</li>)}</ul></section>)}</div></> : <p className="text-sm text-[#6B7280]">Não há jogos nesta rodada.</p>}</div>
  </section>;
}
