import fs from 'fs/promises'

class DirectoryIo {
    constructor() {
        if (!DirectoryIo.instance) {
            DirectoryIo.instance = this
        }
        return DirectoryIo.instance
    }

    async create(dest) {
        await fs.mkdir(dest, { recursive: true })
    }

    async remove(dest) {
        await fs.rm(dest, { recursive: true, force: true })
    }
}

export const directoryIo = new DirectoryIo()
