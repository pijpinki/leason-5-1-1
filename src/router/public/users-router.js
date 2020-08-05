const express = require("express");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const UserModel = require("../../database/models/UserModel");
const errorHandler = require("../../error-handler");
const { isError } = require("lodash");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { login, password = "" } = req.query;

    const [user] = await UserModel.find({ login }).populate("comments");

    if (!user) {
      throw new Error("User not found");
    }

    if (!(await user.isPasswordValid(password))) {
      throw new Error("Password not valid");
    }

    if (user.token || UserModel.isTokenValid(user.token)) {
      user.token = user.generateToken();

      await user.save();
    }

    res.send({ user });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

router.post("/", async (req, res) => {
  try {
    const { login, password } = req.body;

    const user = await UserModel.findOne({ login });

    if (user) throw new Error("Login is busy");

    const newUser = await UserModel.create({
      login,
      password
    });

    res.send({
      _id: newUser._id,
      login: newUser.login
    });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

router.get("/google", async (req, res) => {
  try {
    const { code } = req.query;
    const url = "https://oauth2.googleapis.com/token";

    // Тут мы делаем запрос в гугл с теми данными которые у нас
    // Появились после того как форма гугла кинула нас на наш endpint
    // Цель этого запроса получить aсcess_token с помощу которого мы сможем
    // Делать запросы на api google и получить инфу о пользователе
    // client_id и client_secret генерирует google в настройках OpenId это настраивается
    // один раз
    // code нам приходит из query
    // redirect_uri Должен быть такой же как и ссылке которая открывает форму
    // grant_type Оставляем как есть тут
    const response = await fetch(url, {
      method: "post",
      body: JSON.stringify({
        code,
        client_id:
          "494489327191-u5ei58jvqaolcigonbumra231fgujbrk.apps.googleusercontent.com",
        redirect_uri: "https://w4d7s.sse.codesandbox.io/users/google",
        client_secret: "EsE19-qQfLavoHmS54hljvze",
        grant_type: "authorization_code"
      })
    });

    const body = await response.json();
    const { access_token } = body;

    // Имея на руках access_token мы делаем запрос в google api
    // На получения информации о пользователи
    // Authorization: `Bearer ${access_token}` такой хедер и его генерация
    // Это стандарт oAuth
    const userInfoResposne = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    );

    const userInfo = await userInfoResposne.json();

    // На основе полученной  информации создаем или находим пользователя в базе по
    // userInfo.sub
    // Это уникальный id для каждого пользователя Google
    const user = await UserModel.initUserFromGoogle(
      userInfo.email,
      userInfo.name,
      userInfo.sub
    );

    // Генерируем token для того чтобы после входа через токен
    // Пользователь мог сразу работать с приложением
    user.token = user.generateToken();

    await user.save();

    // Тут нужно делать переадресацию на страницу с фронтом и передать
    // этому самому фронту token пользователя,
    // но пока остается так для наглядности данных
    res.send({ user, googleUser: userInfo });
  } catch (e) {
    errorHandler(e, req, res);
  }
});

router.post("/google", (req, res) => {
  console.info(req.body, req.query);
  res.send();
});

module.exports = router;
