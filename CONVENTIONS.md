# Conventions TaskMaster

- La CI valide uniquement `lint`, les tests unitaires, les tests d'intégration et le build Docker.
- Les scripts k6 restent disponibles pour des vérifications locales, mais ne bloquent pas la CI.
- L'image backend doit rester en multi-stage, exécuter l'application en non-root et exposer un `HEALTHCHECK`.
- Les installations Node en CI doivent utiliser `npm ci` pour garantir la reproductibilité.
