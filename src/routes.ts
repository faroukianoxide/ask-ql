import { Router, } from "express";
import * as queryController from './query.controller'

const router:Router = Router();


router.get('/entry', queryController.loadSchema) 
export default router;