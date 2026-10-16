let promise: Promise<typeof import('mathlive')> | undefined;

/** MathLive is large, so it's only loaded once an exam with math answers opens. */
export function loadMathLive() {
  promise ??= Promise.all([import('mathlive'), import('mathlive/fonts.css')]).then(([ml]) => {
    // Fonts come from the bundled fonts.css; sounds are off for a quiet exam room.
    ml.MathfieldElement.fontsDirectory = null;
    ml.MathfieldElement.soundsDirectory = null;
    return ml;
  });
  return promise;
}
