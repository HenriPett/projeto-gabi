/*
 * ROLLBACK DE EMERGÊNCIA DO SERVICE WORKER.
 * Se o public/sw.js publicado estiver quebrando o site, copie este arquivo por cima
 * de public/sw.js e faça deploy. Na próxima visita ele apaga todos os caches,
 * se desregistra e recarrega as abas abertas — o site volta a funcionar sem SW.
 * Depois de corrigido, restaure o sw.js normal.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.map((n) => caches.delete(n)));
      await self.registration.unregister();
      const abas = await self.clients.matchAll({ type: "window" });
      abas.forEach((aba) => aba.navigate(aba.url));
    })(),
  );
});
