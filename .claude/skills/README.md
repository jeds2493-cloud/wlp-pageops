# Skills del proyecto

Claude Code carga solas las carpetas de aquí (cada una con su `SKILL.md`), también en las sesiones en la nube.

| Skill | Para qué | Origen | Licencia |
|---|---|---|---|
| `impeccable` | Dirección visual, crítica y auditoría de UI | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) v4.4.0 | Apache-2.0 (`LICENSE`, `NOTICE.md`) |
| `ui-ux-pro-max` | Consulta de reglas de UX, accesibilidad y patrones | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT (`LICENSE`) |
| `frontend-design` | Criterio de diseño de interfaces | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 (`LICENSE.txt`) |
| `web-design-guidelines` | Revisión técnica de UI (foco, formularios, toque, copy) | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT (`NOTICE.md`) |
| `generateblocks-layouts` | Maquetas de GenerateBlocks V2 | [wpgaurav/generateblocks-skills](https://github.com/wpgaurav/generateblocks-skills) | MIT (`NOTICE.md`) |
| `html-to-generateblocks` | Convertir HTML/CSS a GenerateBlocks | ídem | MIT (`NOTICE.md`) |
| `figma-to-generateblocks` | Convertir diseños de Figma a GenerateBlocks | ídem | MIT (`NOTICE.md`) |
| `elementor-to-generateblocks` | Convertir Elementor a GenerateBlocks | ídem | MIT (`NOTICE.md`) |

## Cambios respecto al original

- `ui-ux-pro-max`: los comandos llaman a `python3 ".claude/skills/ui-ux-pro-max/scripts/search.py"` desde la raíz de la repo (el original usaba `${CLAUDE_PLUGIN_ROOT}`). Sin la carpeta `tests`.
- `web-design-guidelines`: las reglas van en `references/command.md` en vez de bajarse de internet en cada uso.
- `impeccable`: el lanzador `scripts/impeccable` baja su motor la primera vez que corre (necesita internet). En Windows se usa `scripts/impeccable.cmd`.

## Para actualizarlas

Baja la versión nueva desde su repositorio, revísala y reemplaza la carpeta, conservando los cambios de arriba.
