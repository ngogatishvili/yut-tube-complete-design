const { StatusCodes } = require('http-status-codes');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const User = require('../models/User');
const createError = require('../utils/createError');


const RegisterUser = async (req, res,next) => {
  const {
    name, email, password, repeatPassword,
  } = req.body;
  if (password !== repeatPassword) return next(StatusCodes.BAD_REQUEST,"Passwords do not match");

  const user = await User.create({ name, email, password });
  const token = await user.createJWT();
  res
    .status(StatusCodes.CREATED)
    .json({
      token,
      user: { name: user.name, id: user._id },
    });
};

const LoginUser = async (req, res,next) => {
  const { email, password } = req.body;

  if(!email||!password) return next(createError(StatusCodes.BAD_REQUEST,"Please provide all fields"))

  const user = await User.findOne({ email });
  if (!user) {
    return next(createError(StatusCodes.NOT_FOUND,"no user found with this E-mail"));
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    return next(createError(StatusCodes.UNAUTHORIZED,"invalid credentials"));
  }
  const userImage = user.imageType ? `${user._id}.${user.imageType}` : null;

  const token = await user.createJWT();

  return res
    .status(StatusCodes.OK)
    .json({
      token,
      user: { name: user.name, id: user._id, image: userImage },
    });
};

const changeUsername = async (req, res,next) => {
  const { value } = req.body;
  const { id } = req.params;
 
  if(!value) return next(createError(StatusCodes.BAD_REQUEST,"field is empty!"))
  const user = await User.findById(id);
  user.name = value;

  const updatedUser = await User.findByIdAndUpdate(id, user, { new: true });
  return res.status(StatusCodes.OK).json(updatedUser.name);
};

const uploadImage = async (req, res,next) => {
  if (!req.file) return next(createError(StatusCodes.BAD_REQUEST,"file is not uploaded"));
  const { id } = req.params;
  const user = await User.findById(id);
  const extName = req.file.mimetype.split('/')[1];
  const updatedName = `${id}.${extName}`;
  if (user.imageType) {
    fs.unlinkSync(`./images/${id}.${user.imageType}`);
    fs.rename(`./images/${req.file.filename}`, `./images/${updatedName}`, (err) => {
      if (err) {
        throw err;
      }
    });
  } else {
    fs.rename(`./images/${req.file.filename}`, `./images/${updatedName}`, (err) => {
      if (err) {
        throw err;
      }
    });
  }
  user.imageType = extName;
  await User.findByIdAndUpdate(id, user, { new: true });
  return res.status(200).json(updatedName);
};

const updatePassword = async (req, res,next) => {
  const { id } = req.params;
  const { oldPassword, newPassword, repeatPassword } = req.body;
  if (!oldPassword || !newPassword || !repeatPassword) {
    return next(createError(StatusCodes.BAD_REQUEST,"please fill out all fields"));
  }
  const user = await User.findById(id);
  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordCorrect) {
    return next(createError(StatusCodes.BAD_REQUEST,"Password is not correct"));
  }
  if (newPassword !== repeatPassword) {
    return next(createError(StatusCodes.BAD_REQUEST,"Passwords do not match"));
  }
  const hashedNewPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedNewPassword;
  await User.findByIdAndUpdate(id, user, { new: true });
  return res
    .status(StatusCodes.OK)
    .json({ msg: 'Password updated Succesfully' });
};
   
module.exports = {
  RegisterUser,
  LoginUser,
  changeUsername,
  uploadImage,
  updatePassword,
};
