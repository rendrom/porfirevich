// // based on https://gist.github.com/ryanhaney/d4d205594b2993224b8ad111cebe1a13
// import Quill from 'quill';
// const Clipboard = Quill.import('modules/clipboard');
// const Delta = Quill.import('delta');

// class PlainClipboard extends Clipboard {
//   onPaste(e: any) {
//     e.preventDefault();
//     const range = this.quill.getSelection();
//     const text = e.clipboardData.getData('text/plain');
//     const delta = new Delta()
//       .retain(range.index)
//       .delete(range.length)
//       .insert(text);
//     const index = text.length + range.index;
//     const length = 0;
//     this.quill.updateContents(delta, 'user');
//     this.quill.setSelection(index, length, 'user');
//     this.quill.scrollIntoView();
//   }
// }

// export default PlainClipboard;
