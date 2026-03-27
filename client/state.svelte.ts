export const count = $state({ value: 0 });
export const mouse = $state({ x: 0, y: 0 });

addEventListener("pointermove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
