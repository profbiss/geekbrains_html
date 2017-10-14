'use strict';

// Генератор файлов блока

// Использование: node block [имя блока] [доп. расширения через пробел]

const fs = require('fs');                // будем работать с файловой системой
const mkdirp = require('mkdirp');        // зависимость

let useComments = false; // true - вставлять комментарии для обозначения начала и конца блока в HTML-код

let blockName = process.argv[2];          // получим имя блока
let defaultExtensions = ['styl', 'pug']; // расширения по умолчанию
let extensions = uniqueArray(defaultExtensions.concat(process.argv.slice(3)));  // добавим введенные при вызове расширения (если есть)

// Если есть имя блока
if(blockName) {

  let dirPath = 'src/blocks/' + blockName + '/'; // полный путь к создаваемой папке блока
  mkdirp(dirPath, function(err){                            // создаем

    // Если какая-то ошибка — покажем
    if(err) {
      console.error('Отмена операции: ' + err);
    }

    // Нет ошибки, поехали!
    else {
      console.log('Создание папки ' + dirPath + ' (создана, если ещё не существует)');

      // Обходим массив расширений и создаем файлы, если они еще не созданы
      extensions.forEach(function(extention){

        let filePath = dirPath + blockName + '.' + extention; // полный путь к создаваемому файлу
        let fileContent = '';                                 // будущий контент файла
        let fileCreateMsg = '';                               // будущее сообщение в консоли при создании файла

        // Если это Stylus
        if(extention == 'styl') {

          fileContent = '.' + blockName + '\n    display block\n';

          // Читаем файл импорта стилей
          let connectManagerStyles = fs.readFileSync('src/blocks/blocks.styl', 'utf8');

          // Делаем из строк массив, фильтруем массив, оставляя только строки с незакомментированными импортами
          let fileSystemStyles = connectManagerStyles.split('\n').filter(function(item) {
            if(/^(\s*)@import/.test(item)) return true;
            else return false;
          });

          let stylFileImport = '@import \"../blocks/' + blockName + '/' + blockName + '.styl\"';

          // Создаем регулярку с импортом
          let reg = new RegExp(stylFileImport, '');

          // Создадим флаг отсутствия блока среди импортов
          let impotrtExist = false;

          // Обойдём массив и проверим наличие импорта
          for (var i = 0, j=fileSystemStyles.length; i < j; i++) {
            if(reg.test(fileSystemStyles[i])) {
              impotrtExist = true;
              break;
            }
          }

          // Если флаг наличия импорта по-прежнему опущен, допишем импорт
          if(!impotrtExist) {
            // Открываем файл
            fs.open('src/blocks/blocks.styl', 'a', function(err, fileHandle) {
              // Если ошибок открытия нет...
              if (!err) {
                // Запишем в конец файла
                fs.write(fileHandle, stylFileImport + '\n', null, 'utf8', function(err, written) {
                  if (!err) {
                    console.log('В диспетчер подключений (src/blocks/blocks.styl) записано: ' + stylFileImport);
                  } else {
                    console.log('ОШИБКА записи в src/blocks/blocks.styl: ' + err);
                  }
                });
              } else {
                console.log('ОШИБКА открытия src/blocks/blocks.styl: ' + err);
              }
            });
          }
          else {
            console.log('Импорт НЕ прописан в src/blocks/blocks.styl (он там уже есть)');
          }
        }

        // Если это PUG
        else if(extention == 'pug') {
            if (useComments) {
                fileContent = 'mixin ' + blockName + '()\n    // begin ' + blockName + '\n    .' + blockName + '&attributes(attributes)\n\        \n    // end ' + blockName + '\n';
            } else {
                fileContent = 'mixin ' + blockName + '()\n    .' + blockName + '&attributes(attributes)\n\        ';
            };


        }

        // Если это JS
        else if(extention == 'js') {
          fileContent = '(function(){\n    \n}());\n';

          // Читаем файл импорта js-файлов
          let connectManagerJs = fs.readFileSync('src/blocks/blocks.js', 'utf8');

          // Делаем из строк массив, фильтруем массив, оставляя только строки с незакомментированными импортами
          let fileSystemJs = connectManagerJs.split('\n').filter(function(item) {
            return true;
          });

          let jsFileImport = '//= ../blocks/' + blockName + '/' + blockName + '.js';

          // Создаем регулярку с импортом
          let reg = new RegExp(jsFileImport, '');

          // Создадим флаг отсутствия блока среди импортов
          let impotrtExist = false;

          // Обойдём массив и проверим наличие импорта
          for (var i = 0, j=fileSystemJs.length; i < j; i++) {
            if(reg.test(fileSystemJs[i])) {
              impotrtExist = true;
              break;
            }
          }

          // Если флаг наличия импорта по-прежнему опущен, допишем импорт
          if(!impotrtExist) {
            // Открываем файл
            fs.open('src/blocks/blocks.js', 'a', function(err, fileHandle) {
              // Если ошибок открытия нет...
              if (!err) {
                // Запишем в конец файла
                fs.write(fileHandle, jsFileImport + '\n', null, 'utf8', function(err, written) {
                  if (!err) {
                    console.log('В файл (src/blocks/blocks.js) записано: ' + jsFileImport);
                  } else {
                    console.log('ОШИБКА записи в src/blocks/blocks.js: ' + err);
                  }
                });
              } else {
                console.log('ОШИБКА открытия src/blocks/blocks.js: ' + err);
              }
            });
          }
          else {
            console.log('Импорт НЕ прописан в src/blocks/blocks.js (он там уже есть)');
          }

        }

        // Если нужна подпапка для картинок
        else if(extention == 'img') {
          let imgFolder = dirPath + 'img/';
          if(fileExist(imgFolder) === false) {
            mkdirp(imgFolder, function (err) {
              if (err) console.error(err)
              else console.log('Папка создана: ' + imgFolder)
            });
          }
          else {
            console.log('Папка НЕ создана (уже существует) ')
          }
        }

        // Создаем файл, если он еще не существует
        if(fileExist(filePath) === false && extention !== 'img') {
          fs.writeFile(filePath, fileContent, function(err) {
            if(err) {
              return console.log('Файл НЕ создан: ' + err);
            }
            console.log('Файл создан: ' + filePath);
            if(fileCreateMsg) {
              console.warn(fileCreateMsg);
            }
          });
        }
        else if(extention !== 'img') {
          console.log('Файл НЕ создан: ' + filePath + ' (уже существует)');
        }
      });
    }
  });
}
else {
  console.log('Отмена операции: не указан блок');
}

// Оставить в массиве только уникальные значения (убрать повторы)
function uniqueArray(arr) {
  var objectTemp = {};
  for (var i = 0; i < arr.length; i++) {
    var str = arr[i];
    objectTemp[str] = true; // запомнить строку в виде свойства объекта
  }
  return Object.keys(objectTemp);
}

// Проверка существования файла
function fileExist(path) {
  const fs = require('fs');
  try {
    fs.statSync(path);
  } catch(err) {
    return !(err && err.code === 'ENOENT');
  }
}
