const fs = require('fs');
const uuid = require('uuid'); // Se requiere la biblioteca 'uuid' para generar identificadores únicos


function callFunction(rustplus,text,teamMenSender) {
  if (text.startsWith("help")) {
    help();
  } else if (text.startsWith("private")) {
    saveToFile();
  }
}
function saveToFile(text) {
  // Se genera un identificador único para la nota
  const id = uuid.v4();

  // Se construye el nombre del archivo de texto a partir del identificador único
  const fileName = `note-${id}.txt`;

  fs.writeFile(fileName, text, (err) => {
    if (err) throw err;
    console.log(`The text was successfully saved to the file: ${fileName}`);
  });
}

function getNote(id) {
    // Se construye el nombre del archivo de texto a partir del identificador único
    const fileName = `note-${id}.txt`;
  
    fs.readFile(fileName, 'utf8', (err, text) => {
      if (err) throw err;
      console.log(`The text from the file ${fileName} is: ${text}`);
    });
  }

  function deleteNote(id) {
    // Se construye el nombre del archivo de texto a partir del identificador único
    const fileName = `note-${id}.txt`;
  
    fs.unlink(fileName, (err) => {
      if (err) throw err;
      console.log(`The file ${fileName} was successfully deleted.`);
    });
  }

  function readAllNotes() {
    // Se obtiene la lista de todos los archivos en el directorio actual
    fs.readdir(process.cwd(), (err, files) => {
      if (err) throw err;
  
      // Se filtran los archivos que empiezan por 'note-' y tienen la extensión '.txt'
      const notes = files.filter((file) => {
        return path.extname(file) === '.txt' && file.startsWith('note-');
      });
  
      // Se leen y se muestran el contenido de cada archivo de nota
      notes.forEach((file) => {
        fs.readFile(file, 'utf8', (err, text) => {
          if (err) throw err;
          console.log(`The text from the file ${file} is: ${text}`);
        });
      });
    });
  }

  module.exports = {saveToFile, getNote, readAllNotes};