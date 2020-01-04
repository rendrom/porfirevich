import { Router } from "express";
import UserController from "../controllers/UserController";
import { checkJwt } from "../middlewares/checkJwt";
import { isSelf } from '../middlewares/isSelf';
import { isSuperuser } from 'srv/middlewares/isSuperuser';

const router = Router();

//Get all users
router.get("/", [checkJwt, isSuperuser()], UserController.listAll);

// Get one user
router.get(
  "/:id([0-9]+)",
  [checkJwt, isSuperuser()],
  UserController.getOneById
);

//Create a new user
router.post("/", UserController.newUser);

//Edit one user
router.patch(
  "/:id([0-9]+)",
  [checkJwt, isSelf()],
  UserController.editUser
);

//Delete one user
router.delete(
  "/:id([0-9]+)",
  [checkJwt, isSelf()],
  UserController.deleteUser
);

export default router;
