"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchema = void 0;
const fs = __importStar(require("fs"));
const openai = __importStar(require("openai"));
const db_config_1 = __importDefault(require("./db.config"));
const loadSchema = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        fs.readFile(__dirname + "\\school.schema.json", 'utf8', (err, data) => __awaiter(void 0, void 0, void 0, function* () {
            if (err) {
                console.error(err);
                return;
            }
            //compress the data to reduce prompt tokens.
            let schemaInJSON = JSON.parse(data);
            let schemaInString = JSON.stringify(schemaInJSON);
            let result = yield tryToGenerateQuery(schemaInString, req.query.query);
            if (result instanceof Error)
                return res.sendStatus(403);
            return res.status(200).send(result);
        }));
    }
    catch (e) {
        return res.status(500).send("Error");
    }
});
exports.loadSchema = loadSchema;
const tryToGenerateQuery = (data, queryString) => __awaiter(void 0, void 0, void 0, function* () {
    const configuration = new openai.Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openAIObject = new openai.OpenAIApi(configuration);
    const response = yield openAIObject.createCompletion({
        model: "text-davinci-003",
        prompt: `

        The following is the schema of some tables in a postgresql database in json format:\n\n
        ${data} \n\n

        Write an sql query to get: ${queryString} \n\n
        Answer:
        `,
        temperature: 0,
        max_tokens: 500,
    });
    let query = response.data.choices[0].text;
    if (isQueryClean(query))
        return runPgQuery(query);
    return new Error();
});
const isQueryClean = (query) => {
    let isClean = true;
    let flaggedStmts = ["DELETE", "INSERT", "DROP", "CREATE", "UPDATE", "ALTER"];
    flaggedStmts.forEach((stmt) => {
        if (query.includes(stmt) || query.includes(stmt.toLowerCase())) {
            isClean = false;
            return;
        }
    });
    return isClean;
};
const runPgQuery = (query) => __awaiter(void 0, void 0, void 0, function* () {
    let result = yield db_config_1.default.query(query);
    console.log("Request Completed");
    return result.rows;
});
