import { Application, Request, Response } from 'express'

export default (app: Application) => {


  app.get('/test', (req, res) => {
    res.json({ test: 'success' })
  })
}
