// Создание встроенного изображения для быстрой проверки фильтров.
import { toGray } from "./pixel-utils.js";

export function drawDemo(canvas, context) {
  const width = canvas.width;
  const height = canvas.height;
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#dfe8f0");
  gradient.addColorStop(1, "#8496a7");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#b6c4d0";
  context.beginPath();
  context.moveTo(0, 300);
  context.lineTo(150, 175);
  context.lineTo(280, 300);
  context.lineTo(440, 125);
  context.lineTo(640, 300);
  context.lineTo(640, 420);
  context.lineTo(0, 420);
  context.fill();

  context.fillStyle = "#8ca391";
  context.fillRect(0, 320, width, 100);
  context.fillStyle = "#f1d7a7";
  context.beginPath();
  context.arc(500, 95, 38, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f5f6f7";
  context.fillRect(95, 235, 100, 125);
  context.fillStyle = "#7b8fa1";
  context.fillRect(110, 252, 27, 35);
  context.fillRect(153, 252, 27, 35);
  context.fillStyle = "#657889";
  context.fillRect(133, 310, 27, 50);

  for (let i = 0; i < 380; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    context.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,.55)" : "rgba(15,25,35,.35)";
    context.fillRect(x, y, 2, 2);
  }

  return toGray(context.getImageData(0, 0, width, height));
}
