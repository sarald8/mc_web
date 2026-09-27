export default async function run(page, ui) {
  const out = {};

  await page.waitForSelector(".about figure img", { timeout: 15000 });

  const medir = async (etiqueta) => {
    const r = await page.evaluate(() => {
      const img = document.querySelector(".about figure img");
      const natural = { w: img.naturalWidth, h: img.naturalHeight };
      const rect = img.getBoundingClientRect();
      return {
        natural,
        render: { w: Math.round(rect.width), h: Math.round(rect.height) },
        naturalRatio: +(natural.w / natural.h).toFixed(3),
        renderRatio: +(rect.width / rect.height).toFixed(3)
      };
    });
    out[etiqueta] = {
      ...r,
      deformada: Math.abs(r.naturalRatio - r.renderRatio) > 0.02
    };
  };

  // Móvil pequeño (el caso que reportas)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await medir("movil_390");

  // Móvil grande
  await page.setViewportSize({ width: 430, height: 932 });
  await page.waitForTimeout(600);
  await medir("movil_430");

  // Tablet y escritorio, para confirmar que no se ha roto nada
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(600);
  await medir("tablet_768");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);
  await medir("escritorio_1440");

  return out;
}