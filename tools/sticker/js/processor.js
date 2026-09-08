Sticker.createProcessor = function createProcessor(core) {
  let cachedKey, prepared;
  return function process(job) {
    const key = JSON.stringify([job.sourceId, job.options.displayWidth, job.options.border, job.options.recolor]);
    if (key !== cachedKey) { prepared = core.prepare(job.source, job.options); cachedKey = key; }
    const variants = {};
    for (const name of ["flat", "ink", "blind", "pastel"]) variants[name] = core.finish(prepared, { ...job.options, finish: name });
    const { width, height, art, alpha, light } = prepared;
    const pad = new Uint8ClampedArray(art.length), relief = new Uint8ClampedArray(art.length);
    for (let i = 0; i < art.length; i += 4) {
      pad[i] = pad[i + 1] = pad[i + 2] = 255; pad[i + 3] = alpha[i / 4];
      relief[i] = relief[i + 1] = relief[i + 2] = 235 + light[i / 4]; relief[i + 3] = alpha[i / 4];
    }
    return { id: job.id, variants, stages: [art, pad, relief].map((data) => ({ data, width, height })), width: variants.flat.width, height: variants.flat.height };
  };
};
