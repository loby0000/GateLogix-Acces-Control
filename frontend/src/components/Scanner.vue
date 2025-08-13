<template>
  <div>
    <h2>Escanear Código</h2>
    <input type="file" accept="image/*" @change="leerCodigo" />
    <p v-if="codigo">Código detectado: {{ codigo }}</p>
  </div>
</template>

<script>
import jsQR from "jsqr";

export default {
  name: "Scanner",
  data() {
    return { codigo: "" };
  },
  methods: {
    async leerCodigo(e) {
      const file = e.target.files[0];
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          this.codigo = code.data;
        }
      };
    }
  }
};
</script>
