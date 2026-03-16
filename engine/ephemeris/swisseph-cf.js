// Cloudflare Workers-compatible Swiss Ephemeris loader.
// Bypasses @deno/shim-deno by re-implementing WASI + loader from scratch.
// WASM is imported statically (required by CF Workers — no runtime compilation).

import wasmModule from './libswephe.wasm';

// --- WASI (virtual filesystem + WASI syscall stubs) ---
// Copied from @fusionstrings/swisseph-wasi/esm/src/wasi.js with dntShim removed
class WASI {
  constructor() {
    this.imports = undefined;
    this.memory = undefined;
    this.virtualFiles = new Map();
    this.openFiles = new Map();
    this.nextFd = 10;
    const ENOSYS = 70;
    const ENOENT = 44;
    const EBADF = 8;
    const ES_SUCCESS = 0;
    this.imports = {
      wasi_snapshot_preview1: {
        proc_exit: (rval) => { if (rval !== 0) throw new Error(`proc_exit: ${rval}`); },
        fd_write: (fd, iovs_ptr, iovs_len, nwritten_ptr) => {
          if (!this.memory) return 0;
          const view = new DataView(this.memory.buffer);
          let total = 0;
          for (let i = 0; i < iovs_len; i++) {
            const ptr = iovs_ptr + i * 8;
            const buf_len = view.getUint32(ptr + 4, true);
            if (fd === 1 || fd === 2) {
              const buf_ptr = view.getUint32(ptr, true);
              const buf = new Uint8Array(this.memory.buffer, buf_ptr, buf_len);
              const text = new TextDecoder().decode(buf);
              if (fd === 1) console.log(text); else console.error(text);
            }
            total += buf_len;
          }
          view.setUint32(nwritten_ptr, total, true);
          return ES_SUCCESS;
        },
        path_open: (_dirfd, _dirflags, path_ptr, path_len, _oflags, _fsrb, _fsri, _fdf, fd_out_ptr) => {
          if (!this.memory) return ENOSYS;
          const pathBuf = new Uint8Array(this.memory.buffer, path_ptr, path_len);
          let path = new TextDecoder().decode(pathBuf).replace(/^\.\//, "");
          let content = this.virtualFiles.get(path);
          if (!content) { const fn = path.split("/").pop(); content = this.virtualFiles.get(fn); }
          if (content) {
            const fd = this.nextFd++;
            this.openFiles.set(fd, { pos: 0, content, path });
            new DataView(this.memory.buffer).setUint32(fd_out_ptr, fd, true);
            return ES_SUCCESS;
          }
          return ENOENT;
        },
        path_filestat_get: (_dirfd, _flags, path_ptr, path_len, stat_ptr) => {
          if (!this.memory) return ENOSYS;
          const pathBuf = new Uint8Array(this.memory.buffer, path_ptr, path_len);
          let path = new TextDecoder().decode(pathBuf).replace(/^\.\//, "");
          let content = this.virtualFiles.get(path);
          if (!content) { const fn = path.split("/").pop(); content = this.virtualFiles.get(fn); }
          if (content) {
            const view = new DataView(this.memory.buffer);
            view.setBigUint64(stat_ptr, 0n, true);
            view.setBigUint64(stat_ptr + 8, 0n, true);
            view.setUint8(stat_ptr + 16, 4);
            view.setBigUint64(stat_ptr + 24, 1n, true);
            view.setBigUint64(stat_ptr + 32, BigInt(content.byteLength), true);
            return ES_SUCCESS;
          }
          return ENOENT;
        },
        fd_close: (fd) => { if (this.openFiles.has(fd)) { this.openFiles.delete(fd); return ES_SUCCESS; } return EBADF; },
        fd_read: (fd, iovs_ptr, iovs_len, nread_ptr) => {
          const file = this.openFiles.get(fd);
          if (!file) return EBADF;
          if (!this.memory) return ENOSYS;
          const view = new DataView(this.memory.buffer);
          let totalRead = 0;
          for (let i = 0; i < iovs_len; i++) {
            const ptr = iovs_ptr + i * 8;
            const buf_ptr = view.getUint32(ptr, true);
            const buf_len = view.getUint32(ptr + 4, true);
            const remaining = file.content.byteLength - file.pos;
            const toRead = Math.min(buf_len, remaining);
            if (toRead > 0) {
              new Uint8Array(this.memory.buffer, buf_ptr, toRead).set(file.content.subarray(file.pos, file.pos + toRead));
              file.pos += toRead; totalRead += toRead;
            }
          }
          view.setUint32(nread_ptr, totalRead, true);
          return ES_SUCCESS;
        },
        fd_seek: (fd, offset, whence, new_offset_ptr) => {
          const file = this.openFiles.get(fd);
          if (!file) return EBADF;
          const off = Number(offset);
          if (whence === 0) file.pos = off;
          else if (whence === 1) file.pos += off;
          else if (whence === 2) file.pos = file.content.byteLength + off;
          if (file.pos < 0) file.pos = 0;
          if (file.pos > file.content.byteLength) file.pos = file.content.byteLength;
          if (this.memory) new DataView(this.memory.buffer).setBigUint64(new_offset_ptr, BigInt(file.pos), true);
          return ES_SUCCESS;
        },
        fd_fdstat_get: (fd, stat_ptr) => {
          if (!this.memory) return ENOSYS;
          const view = new DataView(this.memory.buffer);
          if (fd === 1 || fd === 2) { view.setUint8(stat_ptr, 2); view.setUint16(stat_ptr + 2, 0, true); view.setBigUint64(stat_ptr + 8, 64n, true); view.setBigUint64(stat_ptr + 16, 64n, true); return ES_SUCCESS; }
          if (fd === 3) { view.setUint8(stat_ptr, 3); view.setUint16(stat_ptr + 2, 0, true); view.setBigUint64(stat_ptr + 8, 0xffffffffn, true); view.setBigUint64(stat_ptr + 16, 0xffffffffn, true); return ES_SUCCESS; }
          if (this.openFiles.has(fd)) { view.setUint8(stat_ptr, 4); view.setUint16(stat_ptr + 2, 0, true); view.setBigUint64(stat_ptr + 8, 0xffffffffn, true); view.setBigUint64(stat_ptr + 16, 0xffffffffn, true); return ES_SUCCESS; }
          return EBADF;
        },
        clock_time_get: () => ES_SUCCESS,
        clock_res_get: () => ES_SUCCESS,
        sched_yield: () => ES_SUCCESS,
        random_get: () => ES_SUCCESS,
        args_sizes_get: (argc_ptr, argv_len_ptr) => { if (!this.memory) return ENOSYS; const v = new DataView(this.memory.buffer); v.setUint32(argc_ptr, 0, true); v.setUint32(argv_len_ptr, 0, true); return ES_SUCCESS; },
        args_get: () => ES_SUCCESS,
        environ_sizes_get: (envc_ptr, env_len_ptr) => { if (!this.memory) return ENOSYS; const v = new DataView(this.memory.buffer); v.setUint32(envc_ptr, 1, true); v.setUint32(env_len_ptr, 8, true); return ES_SUCCESS; },
        environ_get: (env_ptr, env_buf_ptr) => { if (!this.memory) return ENOSYS; const v = new DataView(this.memory.buffer); const bytes = new TextEncoder().encode("PATH=.\0"); new Uint8Array(this.memory.buffer, env_buf_ptr, bytes.length).set(bytes); v.setUint32(env_ptr, env_buf_ptr, true); return ES_SUCCESS; },
        fd_prestat_get: (fd, prestat_ptr) => { if (fd === 3) { if (!this.memory) return ENOSYS; const v = new DataView(this.memory.buffer); v.setUint8(prestat_ptr, 0); v.setUint32(prestat_ptr + 4, 1, true); return ES_SUCCESS; } return EBADF; },
        fd_prestat_dir_name: (fd, path_ptr, path_len) => { if (fd === 3) { if (!this.memory) return ENOSYS; const bytes = new TextEncoder().encode("."); new Uint8Array(this.memory.buffer, path_ptr, Math.min(path_len, bytes.length)).set(bytes); return ES_SUCCESS; } return EBADF; },
        fd_advise: () => ENOSYS, fd_allocate: () => ENOSYS, fd_datasync: () => ENOSYS,
        fd_fdstat_set_flags: () => ENOSYS, fd_fdstat_set_rights: () => ENOSYS,
        fd_filestat_get: () => ENOSYS, fd_filestat_set_size: () => ENOSYS,
        fd_filestat_set_times: () => ENOSYS, fd_pread: () => ENOSYS,
        fd_pwrite: () => ENOSYS, fd_readdir: () => ENOSYS, fd_renumber: () => ENOSYS,
        fd_sync: () => ENOSYS, fd_tell: () => ENOSYS,
        path_create_directory: () => ENOSYS, path_filestat_set_times: () => ENOSYS,
        path_link: () => ENOSYS, path_readlink: () => ENOSYS,
        path_remove_directory: () => ENOSYS, path_rename: () => ENOSYS,
        path_symlink: () => ENOSYS, path_unlink_file: () => ENOSYS,
        poll_oneoff: () => ENOSYS, sock_accept: () => ENOSYS,
        sock_recv: () => ENOSYS, sock_send: () => ENOSYS, sock_shutdown: () => ENOSYS,
      },
    };
  }
  mount(path, content) { this.virtualFiles.set(path, content); }
  setMemory(memory) { this.memory = memory; }
}

// --- WasmHeap (unchanged from package) ---
class WasmHeap {
  constructor(memory, exports) { this.memory = memory; this.exports = exports; }
  alloc(size) { return this.exports.malloc(size); }
  free(ptr) { this.exports.free(ptr); }
  getU8(ptr, length) { return new Uint8Array(this.memory.buffer, ptr, length); }
  setU8(ptr, data) { new Uint8Array(this.memory.buffer, ptr, data.length).set(data); }
  getF64(ptr, length) { return new Float64Array(this.memory.buffer, ptr, length); }
  getString(ptr) { const b = new Uint8Array(this.memory.buffer); let e = ptr; while (b[e] !== 0) e++; return new TextDecoder().decode(b.subarray(ptr, e)); }
  getI32(ptr) { return new DataView(this.memory.buffer).getInt32(ptr, true); }
  putString(str) { const bytes = new TextEncoder().encode(str + "\0"); const ptr = this.alloc(bytes.length); this.setU8(ptr, bytes); return ptr; }
}

// --- Constants (only the ones our engine uses) ---
export const Constants = {
  SE_GREG_CAL: 1,
  SEFLG_SIDEREAL: 64 * 1024,
  SEFLG_SPEED: 256,
};

/**
 * Load the SwissEph WASM module using the statically imported module.
 * @returns {SwissEphCF} instance
 */
export async function loadFromBytes() {
  const wasi = new WASI();
  const imports = { ...wasi.imports };
  // wasmModule is a pre-compiled WebAssembly.Module from the static import
  const instance = new WebAssembly.Instance(wasmModule, imports);
  wasi.setMemory(instance.exports.memory);
  const heap = new WasmHeap(instance.exports.memory, instance.exports);
  return new SwissEphCF(instance, heap, wasi);
}

// Minimal SwissEph wrapper exposing only the methods our engine uses
class SwissEphCF {
  constructor(instance, heap, wasi) {
    this.instance = instance;
    this.heap = heap;
    this.wasi = wasi;
    this.exports = instance.exports;
  }

  mount(path, content) { this.wasi.mount(path, content); }
  set_ephe_path(path) { const p = this.heap.putString(path); this.exports.swe_set_ephe_path(p); this.heap.free(p); }

  swe_set_sid_mode(mode, t0, ayan_t0) { this.exports.swe_set_sid_mode(mode, t0, ayan_t0); }

  swe_julday(year, month, day, hour, gregflag) {
    return this.exports.swe_julday(year, month, day, hour, gregflag);
  }

  swe_get_ayanamsa_ut(jd) {
    return this.exports.swe_get_ayanamsa_ut(jd);
  }

  swe_calc_ut(jd, planet, flags) {
    const xx_ptr = this.heap.alloc(6 * 8); // 6 doubles
    const serr_ptr = this.heap.putString(" ".repeat(255));
    const ret = this.exports.swe_calc_ut(jd, planet, flags, xx_ptr, serr_ptr);
    const xx = Array.from(this.heap.getF64(xx_ptr, 6));
    const error = this.heap.getString(serr_ptr);
    this.heap.free(xx_ptr);
    this.heap.free(serr_ptr);
    return { returnCode: ret, xx, error };
  }

  swe_houses_ex(jd, flags, lat, lon, hsys) {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const ret = this.exports.swe_houses_ex(jd, flags, lat, lon, hsys, cusps_ptr, ascmc_ptr);
    const cusps = Array.from(this.heap.getF64(cusps_ptr, 13));
    const ascmc = Array.from(this.heap.getF64(ascmc_ptr, 10));
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    return { returnCode: ret, cusps, ascmc };
  }

  swe_houses(jd, lat, lon, hsys) {
    const cusps_ptr = this.heap.alloc(13 * 8);
    const ascmc_ptr = this.heap.alloc(10 * 8);
    const ret = this.exports.swe_houses(jd, lat, lon, hsys, cusps_ptr, ascmc_ptr);
    const cusps = Array.from(this.heap.getF64(cusps_ptr, 13));
    const ascmc = Array.from(this.heap.getF64(ascmc_ptr, 10));
    this.heap.free(cusps_ptr);
    this.heap.free(ascmc_ptr);
    return { returnCode: ret, cusps, ascmc };
  }
}
