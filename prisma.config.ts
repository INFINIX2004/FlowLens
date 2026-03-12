import { defineConfig } from 'prisma/config'
import "dotenv/config"

export default {
  datasource: {
    url: process.env.DATABASE_URL
  }
}