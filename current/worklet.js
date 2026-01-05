class PCMPlayer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);

    // 少し余裕を持たせる（約 250〜300ms）
    this.maxBuffer = 20000;

    this.port.onmessage = (event) => {

      // ★ ここだけ修正（1行に置き換え）
      const float32 = new Float32Array(event.data);

      // バッファ上限を超えないようにしつつ、なるべく残す
      const totalLen = this.buffer.length + float32.length;
      if (totalLen <= this.maxBuffer) {
        const newBuffer = new Float32Array(totalLen);
        newBuffer.set(this.buffer, 0);
        newBuffer.set(float32, this.buffer.length);
        this.buffer = newBuffer;
      } else {
        const newBuffer = new Float32Array(this.maxBuffer);
        const start = totalLen - this.maxBuffer;
        const merged = new Float32Array(totalLen);
        merged.set(this.buffer, 0);
        merged.set(float32, this.buffer.length);
        newBuffer.set(merged.slice(start));
        this.buffer = newBuffer;
      }
    };
  }

  process(inputs, outputs) {
    const output = outputs[0][0];

    if (this.buffer.length >= output.length) {
      output.set(this.buffer.slice(0, output.length));
      this.buffer = this.buffer.slice(output.length);
    } else {
      output.fill(0);
    }

    return true;
  }
}

registerProcessor("pcm-player", PCMPlayer);
