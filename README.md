# Верстка проекта "Шаблон" (template)

## Установка:
Внимание! Для сборки проекта используется Gulp 4-й версии с инкрементальным билдом pug-файлов.

### I. Установка Gulp 4:

а) Удаляем глобальные пакеты текущей версии иставим глобально новую:

> $ npm rm -g gulp
> $ npm install -g gulp-cli

б) Удаляем текущую локальную версию и ставим локально 4-ю версию

> $ npm uninstall gulp --save-dev
> $ npm install 'gulpjs/gulp.git#4.0' --save-dev


### II. Установка зависимостей проекта

> $ npm i

### III. Сборка проекта:

а) Обычная сборка (development)

> $ gulp

б) Production сборка

> $ gulp \-\-production

#### Генерация папки и файлов нового блока с их интеграцией в систему:

> $ node block [имя блока] [доп. расширения через пробел]

По умолчанию в директории "src/blocks" создается новая папка с именем блока, в ней создаются pug и styl файлы, а ссылка на styl файл также прописывается в файле подключения стилей "src/block/blocks.styl"

При использовании доп.расширения "js" в папке блока создается js файл этого блока и прописывается в файле подключения скриптов "src/block/blocks.js"
