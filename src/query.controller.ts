import * as fs from 'fs'
import * as openai from 'openai'
import * as express from 'express'

import pool from './db.config'


export const loadSchema = async (req: express.Request, res: express.Response):Promise<any> => {

    try {
        fs.readFile(__dirname + "\\school.schema.json", 'utf8', async (err: NodeJS.ErrnoException | null, data: string) => {
            if (err) {
                console.error(err);
                return;
            }
            //compress the data to reduce prompt tokens.
            let schemaInJSON: JSON = JSON.parse(data)
            let schemaInString: string = JSON.stringify(schemaInJSON)
    
            let result:Promise<Array<any>>|Error =  await tryToGenerateQuery(schemaInString, req.query.query)

            if (result instanceof Error)
                return res.sendStatus(403);
            
            return res.status(200).send(result)
        });
    } catch (e) {
        return res.status(500).send("Error")
    }

}

const tryToGenerateQuery = async (data: string, queryString: any):Promise<any> => {

    const configuration: openai.Configuration = new openai.Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openAIObject: openai.OpenAIApi = new openai.OpenAIApi(configuration);
    const response: any = await openAIObject.createCompletion({
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
        return runPgQuery(query)
    return new Error();

}

const isQueryClean = (query: string):boolean => {
    let isClean = true;
    let flaggedStmts: string[] = ["DELETE","INSERT", "DROP", "CREATE", "UPDATE", "ALTER"];
    flaggedStmts.forEach((stmt) => {
        if (query.includes(stmt) || query.includes(stmt.toLowerCase()) ) {
            isClean = false;
            return;
        }
    })
    return isClean;
    
}

const runPgQuery = async (query: string):Promise<Array<object>> => {

    let result: any = await pool.query(query)
    console.log("Request Completed")

    return result.rows


}
