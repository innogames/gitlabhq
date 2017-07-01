let RepoStore = {
  service: '',
  editor: '',
  sidebar: '',
  isTree: false,
  prevURL: '',
  trees: [],
  blobs: [],
  submodules: [],
  blobRaw: '',
  blobRendered: '',
  openedFiles: [],
  activeFile: '',
  files: [],
  binary: false,
  binaryMimeType: '',
  //scroll bar space for windows
  scrollWidth: 0,
  binaryTypes: {
    png: false
  }
};
export default RepoStore;
