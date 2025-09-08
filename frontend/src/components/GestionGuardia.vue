<script>
import logoUrl from '../assets/logo.png';
export default {
  name: "GateLogixTable",
  data() {
    return {
      search: "",
      filtroActivo: false,
      usuarios: [
        { documento: "1032456789", nombre: "Ana Gómez", jornada: "Mañana", registros: 12, activo: true },
        { documento: "9876543210", nombre: "Luis Pérez", jornada: "Tarde", registros: 8, activo: false },
        { documento: "1122334455", nombre: "María Ruiz", jornada: "Mixta", registros: 21, activo: true },
        { documento: "5566778899", nombre: "Carlos Ortiz", jornada: "Noche", registros: 3, activo: true },
        { documento: "7788990011", nombre: "Sofía León", jornada: "Mañana", registros: 15, activo: false },
        { documento: "4433221100", nombre: "Jorge Rivas", jornada: "Tarde", registros: 9, activo: true },
        { documento: "7654321098", nombre: "Elena Díaz", jornada: "Mixta", registros: 6, activo: true },
      ],
      modalVisible: false,
      usuarioEdit: {},
      logoUrl,
    };
  },
  computed: {
    usuariosFiltrados() {
      return this.usuarios.filter((u) => {
        const filtroDocumento = u.documento.includes(this.search);
        const filtroAct = !this.filtroActivo || u.activo;
        return filtroDocumento && filtroAct;
      });
    },
  },
  methods: {
    abrirModal(usuario) {
      this.usuarioEdit = { ...usuario };
      this.modalVisible = true;
    },
    cerrarModal() {
      this.modalVisible = false;
    },
    guardarUsuario() {
      const idx = this.usuarios.findIndex(u => u.documento === this.usuarioEdit.documento);
      if (idx !== -1) {
        this.usuarios[idx] = { ...this.usuarioEdit };
      }
      this.cerrarModal();
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 30px auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.logo {
  text-align: center;
  margin-bottom: 25px;
}

.logo img {
  height: 4000px;
  max-width: 380px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.search-input {
  width: 320px;
  max-width: 100%;
  background-color: #333;
  border-radius: 10px;
  border: none;
  height: 45px;
  padding-left: 10px;
  color: #bbb;
  font-size: 1rem;
  margin-right: 20px;
}

.search-input::placeholder {
  color: #bbb;
}

.activo-label {
  background: white;
  border-radius: 22px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 700;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  color: #222;
}

.activo-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

table {
  width: 100%;
  min-width: 1200px;
  border-collapse: separate;
  border-spacing: 0 10px;
  font-weight: 600;
}

th, td {
  padding: 15px 10px;
  text-align: center;
  font-weight: 600;
  font-size: 1.05rem;  
}

thead th {
  background: #fff;
  color: #333;
  border-bottom: 1px solid #ddd;
  text-transform: uppercase;
}

tbody tr {
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgb(7 7 7 / 0.06);
  vertical-align: middle;
  font-weight: 400;
}

tbody tr td {
  font-weight: 500;
  font-family: monospace;
}

.badge {
  display: inline-block;
  text-align: center;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #222;
}

.activo {
  background-color: #c2f0dc;
  color: #116a3b;
}

.inactivo {
  background-color: #f6c4c4;
  color: #831212;
}

.editar-input {
  border-radius: 15px;
  border: 1px solid #a9b1ff;
  height: 35px;
  width: 70px;
}

.editar-btn {
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 8px 18px;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
}

.editar-btn:hover {
  background: #3550b2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 18px;
  padding: 24px 22px;
  min-width: 260px;
  max-width: 320px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
}
.modal-field {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  justify-content: center;
}
.jornada-field {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
}
.modal-field input[disabled] {
  background: #333;
  color: #bbb;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
}
.modal-field select {
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 6px 12px;
  font-size: 1rem;
}
.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}
</style>