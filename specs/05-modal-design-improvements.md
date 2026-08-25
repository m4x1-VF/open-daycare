# SPEC 05 — Mejoras de diseño AddChildModal

> **Estado:** Implementada
> **Depende de:** SPEC 04
> **Fecha:** 2026-08-25
> **Objetivo:** Mejorar la experiencia de usuario de la modal de agregar niño con animaciones, micro-interacciones, validación en tiempo real y accesibilidad, respetando las preferencias del usuario para reducir movimiento.

## Scope

**In:**

- Animación de entrada: opacity 0→1 + scale(0.95)→scale(1), 200ms con cubic-bezier(0.23, 1, 0.32, 1)
- Animación de salida: misma curva invertida, 150ms
- Backdrop fade-in: opacity 0→0.4, 200ms ease-out
- Feedback de presión en botones Cancelar/Guardar: `active:scale-[0.97]`, 160ms ease-out
- Transición suave en bordes de inputs (normal → error): `transition-colors` 200ms
- Validación en tiempo real después del primer blur (errores se muestran/ocultan en cada cambio)
- Cerrar con tecla Escape (listener keydown)
- Auto-focus en el primer input al abrir la modal
- Prevenir scroll del body: `overflow-hidden` cuando `open === true`, restaurar al cerrar
- Focus states mejorados en inputs: `focus:border-coral-dark` + `focus:ring-2 focus:ring-coral-light/20`
- Hover states en inputs: `hover:border-[#D4C4B0]` (solo desktop)

**Out of scope (para specs futuras):**

- Dropdown custom animado para el campo sala
- Sombras en focus de inputs
- Refactor de espaciado con utility classes (`space-y-*`)
- Animación específica en mensajes de error (transición de opacity)
- Trap focus dentro de la modal (Tab cycling)
- Persistencia de datos del form entre aperturas
- Indicador de progreso de validación
- Tooltips en los campos del formulario
- Modo oscuro / dark mode

## Data model

Esta spec **no introduce nuevos tipos ni estructuras de datos**. Reutiliza `Child` de `app/_lib/child-types.ts` y las props de `AddChildModal` definidas en SPEC 04.

Los cambios son puramente de UI/UX: animaciones, estados visuales, validación y accesibilidad.

## Implementation plan

1. **Setup base de animaciones:** Agregar `data-state` attribute al overlay y modal-card para controlar los estados de entrada/salida. Definir estados CSS con `opacity` y `transform: scale()`. Usar `@starting-style` con fallback a `data-mounted` pattern con `useEffect` para compatibilidad.

2. **Animación de entrada/salida:** Overlay con backdrop fade-in (opacity 0→0.4, 200ms). Modal card con scale(0.95)→scale(1) + opacity 0→1. Transición con cubic-bezier(0.23, 1, 0.32, 1). Salida más rápida (150ms). Envolver todas las animaciones en `@media (prefers-reduced-motion: no-preference)` para respetar la preferencia del usuario.

3. **Body scroll lock:** En `useEffect`, cuando `open` cambia a `true`: `document.body.style.overflow = 'hidden'`. Cleanup cuando cambia a `false` o el componente se desmonta. Restaurar el valor original del overflow.

4. **Auto-focus:** Crear `ref` para el primer input (nombre). En `useEffect` que depende de `open`, si es `true`, hacer `ref.current?.focus()` después de un pequeño delay (~50ms) para evitar jump visual durante la animación de entrada.

5. **Escape key listener:** En `useEffect`, agregar `document.addEventListener('keydown', handleEscape)`. `handleEscape` verifica si la tecla es `Escape` y llama a `handleClose`. Cleanup en el return del effect para remover el listener.

6. **Feedback de presión:** Agregar `active:scale-[0.97] transition-transform duration-150` a los botones Cancelar y Guardar. Usar `transition` en lugar de `transition-all` para mejor performance (solo animar transform).

7. **Focus states en inputs:** Agregar `focus:outline-none focus:border-coral-dark focus:ring-2 focus:ring-coral-light/20 transition-colors` a los inputs. Asegurar que el focus ring no rompa el layout (`focus:ring-offset-0`).

8. **Hover states en inputs:** Agregar `hover:border-[#D4C4B0]` solo en desktop usando media query `@media (hover: hover) and (pointer: fine)` para evitar falsos positivos en dispositivos táctiles.

9. **Transición suave en bordes de error:** Los inputs ya tienen `border-red-400` condicional. Agregar `transition-colors duration-200` para suavizar el cambio entre estados normal/error.

10. **Validación en tiempo real:** Cambiar el cálculo de errores para que se evalúen en cada render cuando el campo ya fue tocado. Mantener la lógica de `touchedX` pero eliminar la dependencia de `touched` para mostrar el error — el error se muestra si el campo fue tocado Y es inválido, pero se re-evalúa en cada cambio (no solo en blur).

11. **Respetar prefers-reduced-motion:** Envolver todas las animaciones de scale en `@media (prefers-reduced-motion: no-preference)`. Si el usuario tiene reduced-motion, las animaciones se reducen a opacity-only o se eliminan completamente.

## Acceptance criteria

- [x] Abrir la modal muestra animación de entrada suave (scale + opacity) en ~200ms
- [x] Cerrar la modal muestra animación de salida (scale + opacity invertida) en ~150ms
- [x] El backdrop aparece con fade-in desde transparente hasta semi-transparente
- [x] Presionar Cancelar o Guardar muestra feedback visual (scale down) inmediatamente
- [x] Soltar el botón restaura el tamaño con transición suave
- [x] Hacer Tab desde el botón "Agregar niño" enfoca automáticamente el input de nombre
- [x] Presionar Escape cierra la modal (después de que esté abierta)
- [x] El body de la página no hace scroll cuando la modal está abierta
- [ ] Al cerrar la modal, el scroll del body se restaura — **BUG**: `document.body.style.overflow` permanece en `"hidden"` después de cerrar. El efecto de restauración (`useEffect` dependiente de `shouldRender`) no se ejecuta correctamente. Ver `add-child-modal.tsx` línea 112-116.
- [x] Tocar un campo y dejarlo vacío muestra el error
- [x] Después del primer blur, los errores aparecen/desaparecen en tiempo real al escribir
- [x] Enfocar un input muestra un anillo de focus visible (border coral + ring)
- [x] Hover sobre un input (solo desktop) muestra un border más oscuro
- [x] El cambio de border normal → error es una transición suave, no instantánea
- [x] Con `prefers-reduced-motion: reduce`, las animaciones de escala se eliminan y solo queda opacity
- [x] `npm run lint` finaliza sin errores
- [x] `npx tsc --noEmit` finaliza sin errores
- [x] Todos los acceptance criteria de SPEC 04 siguen pasando (regresión)

## Decisions

- **Sí:** Animación de entrada con scale + opacity (200ms cubic-bezier(0.23, 1, 0.32, 1))
  - **Por qué:** "Nothing appears from nothing" — la modal debe sentirse como algo que entra naturalmente, no como algo que aparece de la nada. Duración <300ms para sentirse responsive.

- **No:** Animación de salida más lenta que la de entrada
  - **Por qué:** "Asymmetric enter/exit timing" — la salida debe ser más rápida (150ms) para no hacer sentir al usuario que la app "lo retiene" al cerrar.

- **Sí:** Body scroll lock con `document.body.style.overflow`
  - **Por qué:** Estándar de UX para modales, evita confusión visual cuando hay contenido scrolleable detrás.

- **Sí:** Auto-focus en el primer input
  - **Por qué:** Permite al usuario empezar a escribir inmediatamente, mejora el flujo.

- **No:** Trap focus dentro de la modal (Tab cycling)
  - **Por qué:** Over-engineering para este caso. La modal es simple, no tiene muchos elementos focuseables. Se puede agregar después si se nota que es un problema.

- **Sí:** Validación en tiempo real después del primer blur
  - **Por qué:** Mejor UX, feedback inmediato mientras el usuario escribe. No muestra errores antes del primer blur (evita "ruido" visual).

- **No:** Validación en tiempo real desde el inicio (sin esperar primer blur)
  - **Por qué:** Mostrar errores antes de que el usuario interactúe es agresivo y confuso.

- **Sí:** Respetar `prefers-reduced-motion`
  - **Por qué:** Accesibilidad básica. Usuarios con sensibilidad al movimiento lo agradecen. Costo mínimo de implementación.

- **No:** Dropdown custom animado
  - **Por qué:** El select nativo del navegador ya tiene una animación familiar para el usuario. Crear uno custom es trabajo significativo para valor marginal.

- **Sí:** Mantener select nativo del navegador
  - **Por qué:** Accesibilidad out-of-the-box (navegación con teclado, screen readers), familiaridad del usuario, menos código.

- **Sí:** Escape para cerrar
  - **Por qué:** Estándar de UX universal, los usuarios lo esperan.

- **No:** Click fuera de la modal para cerrar (ya está implementado en SPEC 04)
  - **Por qué:** Ya funciona, no es parte de las mejoras.

- **Sí:** Feedback de presión con `active:scale-[0.97]`
  - **Por qué:** "Buttons must feel responsive" — confirmación visual inmediata de que el botón respondió.

- **No:** Usar Framer Motion para las animaciones
  - **Por qué:** CSS transitions son suficientes, más performantes (off main thread), menos bundle size.

- **Sí:** Usar `@starting-style` con fallback a `data-mounted`
  - **Por qué:** API moderna para animar entrada sin JavaScript, con fallback para compatibilidad.

- **No:** Spring animations
  - **Por qué:** Las modales no son gestures interrumpibles. CSS transitions con custom easing son suficientes y más predecibles.

## Risks

| Risk | Mitigation |
|------|-----------|
| Auto-focus puede ser problemático para usuarios con screen readers | Usar `autoFocus` solo cuando se abre programáticamente, no en mount |
| Body scroll lock puede causar layout shift en algunos navegadores | Usar `overflow-hidden` en lugar de `position: fixed` para evitar el shift |
| Animaciones pueden sentirse lentas en dispositivos low-end | Duración corta (150-200ms), solo opacity + transform (GPU-accelerated) |
| prefers-reduced-motion puede no estar soportado en navegadores antiguos | Fallback: las animaciones se ejecutan pero más cortas (100ms) |

## What is **not** in this spec

- Dropdown custom animado para el campo sala
- Sombras en focus de inputs
- Refactor de espaciado con utility classes (`space-y-*`)
- Animación específica en mensajes de error (transición de opacity)
- Trap focus dentro de la modal (Tab cycling)
- Persistencia de datos del form entre aperturas
- Indicador de progreso de validación (ej: "2 de 3 campos completos")
- Tooltips en los campos del formulario
- Modo oscuro / dark mode

Cada una de esas, si se implementa, va en su propia spec.
