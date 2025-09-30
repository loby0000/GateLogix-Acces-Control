<template>
  <div class="scanner-container">
    <h2 class="scanner-title">Escanear Código</h2>
    <div class="upload-section">
      <input type="file" accept="image/*" @change="leerCodigo" class="file-input" id="file-input" />
      <label for="file-input" class="file-label">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Seleccionar imagen para escanear</span>
      </label>
    </div>
    <div v-if="codigo" class="result-section">
      <h3 class="result-title">Código detectado:</h3>
      <p class="result-code">{{ codigo }}</p>
    </div>
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

<style scoped>
.scanner-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  color: white;
  text-align: center;
}

.scanner-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  background: linear-gradient(45deg, #ffffff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.upload-section {
  margin-bottom: 2rem;
}

.file-input {
  display: none;
}

.file-label {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  min-height: 120px;
  justify-content: center;
}

.file-label:hover {
  border-color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.8);
}

.file-label span {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.result-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.result-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.result-code {
  font-size: 1rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  padding: 1rem;
  border-radius: 8px;
  word-break: break-all;
  margin: 0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive Design - Laptop (768px - 1024px) */
@media (max-width: 1024px) and (min-width: 768px) {
  .scanner-container {
    padding: 1.8rem;
    max-width: 550px;
  }
  
  .scanner-title {
    font-size: 1.8rem;
  }
  
  .file-label {
    padding: 1.8rem;
    min-height: 110px;
  }
  
  .upload-icon {
    width: 44px;
    height: 44px;
  }
  
  .file-label span {
    font-size: 1rem;
  }
}

/* Responsive Design - Tablet (481px - 768px) */
@media (max-width: 768px) and (min-width: 481px) {
  .scanner-container {
    padding: 1.5rem;
    max-width: 90%;
    margin: 1rem auto;
  }
  
  .scanner-title {
    font-size: 1.6rem;
    margin-bottom: 1.5rem;
  }
  
  .file-label {
    padding: 1.5rem;
    min-height: 100px;
  }
  
  .upload-icon {
    width: 40px;
    height: 40px;
  }
  
  .file-label span {
    font-size: 0.95rem;
  }
  
  .result-section {
    padding: 1.2rem;
  }
  
  .result-title {
    font-size: 1.1rem;
  }
  
  .result-code {
    font-size: 0.9rem;
    padding: 0.8rem;
  }
}

/* Responsive Design - Mobile (≤480px) */
@media (max-width: 480px) {
  .scanner-container {
    padding: 1rem;
    margin: 0.5rem;
    max-width: calc(100% - 1rem);
    border-radius: 12px;
  }
  
  .scanner-title {
    font-size: 1.4rem;
    margin-bottom: 1.2rem;
  }
  
  .upload-section {
    margin-bottom: 1.5rem;
  }
  
  .file-label {
    padding: 1.2rem;
    min-height: 90px;
    gap: 0.8rem;
  }
  
  .upload-icon {
    width: 36px;
    height: 36px;
  }
  
  .file-label span {
    font-size: 0.9rem;
    text-align: center;
  }
  
  .result-section {
    padding: 1rem;
  }
  
  .result-title {
    font-size: 1rem;
    margin-bottom: 0.8rem;
  }
  
  .result-code {
    font-size: 0.85rem;
    padding: 0.7rem;
  }
}

/* Mobile Landscape */
@media (max-width: 768px) and (orientation: landscape) {
  .scanner-container {
    padding: 1rem 1.5rem;
    max-width: 80%;
  }
  
  .scanner-title {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  
  .file-label {
    padding: 1rem 1.5rem;
    min-height: 80px;
    flex-direction: row;
    gap: 1rem;
  }
  
  .upload-icon {
    width: 32px;
    height: 32px;
  }
  
  .file-label span {
    font-size: 0.9rem;
  }
  
  .result-section {
    padding: 0.8rem;
  }
}
</style>
