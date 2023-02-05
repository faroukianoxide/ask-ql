import app from './src/app'

const port:string | undefined | number  = process.env.PORT || 3000;

app.listen(port, ()=> {
    console.log(`listening from port ${port}`)
})

