class PCMPlayer extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(0);

    this.port.onmessage = (event) => {
      const pcm = new Int16Array(event.data);
      const float32 = new Float32Array(pcm.length);

      for (let i = 0; i < pcm.length; i++) {
        float32[i] = pcm[i] / 32768;
      }

      // バッファに追加
      const newBuffer = new Float32Array(this.buffer.length + float32.length);
      newBuffer.set(this.buffer);
      newBuffer.set(float32, this.buffer.length);
      this.buffer = newBuffer;
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
