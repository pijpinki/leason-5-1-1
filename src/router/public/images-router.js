const express = require("express");
const path = require("path");
const mime = require("mime-types");
const uuid = require("uuid").v4;
const fs = require("fs").promises;
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");

const errorHandler = require("../../error-handler");
const fileSaver = require("../../file-saver");
const FileModel = require("../../database/models/FileModel");

const router = express.Router();

const IMAGES_PATH = path.join(process.cwd(), "src", "public");
const TMP_PATH = path.join(process.cwd(), "src", "public", "tmp");

/**
 * Пример сохранения изображения уже через multer
 *
 * image это названия поля в котором передается изображение"
 */
router.post("/multer", fileSaver.single("image"), async (req, res) => {
  try {
    /**
     * После того как multer сделает свое дело
     * В объекте req у нас будет поле file в котором есть информация
     * О файле который заржал пользователь
     */
    const { file } = req;
    const filepath = path.join(
      IMAGES_PATH,
      `${file.filename}.${mime.extension(file.mimetype)}`
    );

    /**
     * Тут мы из временно хранилища переносим файл в место где он уже будет
     * Хранится постоянно
     */
    await fs.rename(file.path, filepath);

    /**
     * И обязательно пишем в базу данных
     */
    await FileModel.create({
      path: filepath,
      mimetype: file.mimetype
    });

    res.send({ ok: true });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

/**
 * Пример сохранения изображения с оригинальном размере и уменьшенном
 */
router.post("/multer-min", fileSaver.single("image"), async (req, res) => {
  try {
    const { file } = req;
    const filepath = path.join(
      IMAGES_PATH,
      `${file.filename}.${mime.extension(file.mimetype)}`
    );
    const smallFilePath = path.join(
      IMAGES_PATH,
      `small-${file.filename}.${mime.extension(file.mimetype)}`
    );

    /**
     * Используя библиотеку для сжатия изображения
     * Сжимаем наще изображения во временую директорию
     */
    const [smallFile] = await imagemin([file.path], {
      destination: path.join(TMP_PATH, "small"),
      plugins: [
        imageminJpegtran(),
        imageminPngquant({
          quality: [0.6, 0.8]
        })
      ]
    });

    /**
     * Переносим большой и маленький файл в место постоянно хранения
     */
    await fs.rename(file.path, filepath);
    await fs.rename(smallFile.destinationPath, smallFilePath);

    /**
     * И записываем в базу
     */
    await FileModel.create({
      path: filepath,
      minImagePath: smallFilePath,
      mimetype: file.mimetype
    });

    res.send({ ok: true });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

/**
 * Пример того как можно записать файл одной операцией а все кусочки собирать а RAM
 *
 * Преимущества - Меньше операций с диском
 * Более быстра работа
 * Недостатки - Большое потребления RAM, при большом количестве загрузок
 * приложение упадет
 */
router.post("/memory-storage", async (req, res) => {
  try {
    const filename = path.join(IMAGES_PATH, `ms-${uuid()}.png`);
    /**
     * Создаем хранилище, где будем собирать кусочки файла
     */
    let storage = Buffer.from([]);

    req.on("data", message => {
      /**
       * Добавляем в хранилище новые кусочки
       */
      storage = Buffer.concat([storage, message]);
    });

    req.on("end", () => {
      /**
       * После того как мы получили все кусочки записываем, в файл
       */
      fs.writeFile(filename, storage)
        .then(() =>
          FileModel.create({
            path: filename,
            mimetype: req.headers["content-type"]
          })
        )
        .then(() => res.send())
        .catch(e => errorHandler(e, req, res));
    });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

/**
 * Пример как мы можем сохранить файл используя только express
 * И нативные модули
 *
 * Преимущества - Минимальное потребление памяти
 * Стабильность работы
 * Недостатки - Больше операций с диском
 * Скорость работы
 */
router.post("/", async (req, res) => {
  try {
    let error = null;
    const filename = path.join(IMAGES_PATH, `${uuid()}.png`);

    // Создаем новый пустой файл
    await fs.writeFile(filename, Buffer.from([]));

    // Вызывается каждый раз, как пришел кусочек файла
    req.on("data", message => {
      if (error) return;

      // Дописываем в файл который мы создали
      fs.appendFile(filename, message).catch(e => {
        error = e;
      });
    });

    req.on("end", () => {
      if (error) return errorHandler(error, req, res);

      // После того как все кусочки файла были переданы записываем информацию по нему
      // В базу данных
      FileModel.create({
        path: filename,
        mimetype: req.headers["content-type"]
      })
        .then(() => res.send({ ok: true }))
        .catch(e => errorHandler(e, req, res));
    });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

router.get("/random", async (req, res) => {
  const count = await FileModel.countDocuments();
  const random = Math.floor(Math.random() * (+count - +0)) + +0;
  const [image] = await FileModel.find().skip(random);

  if (!image) {
    return res.status(404).send({ message: "Not found" });
  }

  return res.sendFile(image.path);
});

router.get("/random/small", async (req, res) => {
  const count = await FileModel.countDocuments({ minImagePath: { $ne: null } });
  const random = Math.floor(Math.random() * (+count - +0)) + +0;
  const [image] = await FileModel.find({ minImagePath: { $ne: null } }).skip(
    random
  );

  if (!image) {
    return res.status(404).send({ message: "Not found" });
  }

  return res.sendFile(image.path);
});

module.exports = router;
