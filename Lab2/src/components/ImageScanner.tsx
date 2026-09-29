"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUpDown, CheckCircle2, FolderOpen, Search, Square, Upload } from "lucide-react";
import { Scanner } from "../core/scanner";
import { ImageInfo } from "../core/types";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export default function ImageScanner() {
	const folderInput = useRef<HTMLInputElement>(null);
	const fileInput = useRef<HTMLInputElement>(null);
	const scanner = useRef<Scanner | null>(null);
	const [rows, setRows] = useState<ImageInfo[]>([]);
	const [total, setTotal] = useState(0);
	const [done, setDone] = useState(0);
	const [busy, setBusy] = useState(false);
	const [query, setQuery] = useState("");
	const [sort, setSort] = useState<keyof ImageInfo>("name");

	const start = (files: FileList | null) => {
		if (!files?.length) return;
		scanner.current?.cancel();
		const list = Array.from(files);
		setRows([]);
		setTotal(list.length);
		setDone(0);
		setBusy(true);

		const current = new Scanner();
		scanner.current = current;
		current.scan(
			list,
			(item) => setRows((prev) => [...prev, item]),
			(value) => setDone(value),
			() => {
				setBusy(false);
				scanner.current = null;
			},
		);
	};

	const filtered = useMemo(() => {
		const q = query.trim().toLocaleLowerCase("ru");
		return rows.filter((r) => !q || `${r.name} ${r.path} ${r.format} ${r.error ?? ""}`.toLocaleLowerCase("ru").includes(q)).sort((a, b) => String(a[sort] ?? "").localeCompare(String(b[sort] ?? ""), "ru", { numeric: true }));
	}, [rows, query, sort]);

	const errors = rows.filter((r) => r.status === "error").length;
	const percent = total ? Math.min(100, (done / total) * 100) : 0;

	return (
		<main className="page">
			<header className="topbar">
				<div className="brand">
					<span className="brandMark">IMG</span>
				</div>
				{/* <div className="topbarHint">Файлы изображений</div> */}
			</header>

			<section className="hero">
				<div>
					<h1>Сведения об изображениях</h1>
					<p>Выберите папку или несколько файлов, чтобы посмотреть основные параметры.</p>
				</div>
				<div className="heroActions">
					<button className="primary" onClick={() => folderInput.current?.click()}>
						<FolderOpen size={18} /> Выбрать папку
					</button>
					<button className="secondary" onClick={() => fileInput.current?.click()}>
						<Upload size={18} /> Файлы
					</button>
					<input ref={folderInput} hidden type="file" multiple {...({ webkitdirectory: "", directory: "" } as Record<string, string>)} onChange={(e) => start(e.target.files)} />
					<input ref={fileInput} hidden type="file" multiple accept=".jpg,.jpeg,.gif,.tif,.tiff,.bmp,.png,.pcx" onChange={(e) => start(e.target.files)} />
				</div>
			</section>

			<section className="panel controls">
				<div className="progressInfo">
					<div className="progressTitle">{busy ? "Обработка файлов" : total ? "Обработка завершена" : "Ожидание файлов"}</div>
					<div className="progressCount">
						{fmt(done)} / {fmt(total)}
					</div>
				</div>
				<div className="progressTrack">
					<div className="progressValue" style={{ width: `${percent}%` }} />
				</div>
				<div className="controlRow">
					<div className="stats">
						<span>
							<CheckCircle2 size={15} /> {fmt(rows.filter((r) => r.status === "ok").length)} обработано
						</span>
						<span>{fmt(errors)} ошибок</span>
					</div>
					<div className="controlRight">
						<div className="search">
							<Search size={16} />
							<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по файлам" />
						</div>
						{busy && (
							<button
								className="stop"
								onClick={() => {
									scanner.current?.cancel();
									setBusy(false);
								}}
							>
								<Square size={14} /> Остановить
							</button>
						)}
					</div>
				</div>
			</section>

			<section className="panel tablePanel">
				<div className="tableScroll">
					<table>
						<thead>
							<tr>
								{(
									[
										["name", "Имя файла"],
										["format", "Формат"],
										["width", "Размер"],
										["dpiX", "DPI"],
										["colorDepth", "Глубина"],
										["compression", "Сжатие"],
										["path", "Путь"],
										["status", "Статус"],
									] as const
								).map(([key, label]) => (
									<th key={key} onClick={() => setSort(key)}>
										{label}
										<ArrowUpDown size={12} />
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((r) => (
								<tr key={r.id}>
									<td title={r.name}>
										<strong>{r.name}</strong>
									</td>
									<td>
										<span className="badge">{r.format}</span>
									</td>
									<td>{r.width && r.height ? `${fmt(r.width)} × ${fmt(r.height)}` : "—"}</td>
									<td>{r.dpiX && r.dpiY ? `${r.dpiX.toFixed(1)} × ${r.dpiY.toFixed(1)}` : "—"}</td>
									<td>{r.colorDepth ? `${r.colorDepth} bit` : "—"}</td>
									<td title={r.details}>{r.compression || "—"}</td>
									<td title={r.path}>{r.path}</td>
									<td className={r.status === "ok" ? "statusOk" : "statusError"}>{r.status === "ok" ? "OK" : r.error || "Ошибка"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{!rows.length && (
					<div className="empty">
						<FolderOpen size={32} />
						<h2>Нет данных</h2>
						<p>Выберите папку или файлы для начала обработки.</p>
					</div>
				)}
			</section>

			<div className="footer">Поддерживаемые форматы: JPG · GIF · TIFF · BMP · PNG · PCX</div>
		</main>
	);
}
