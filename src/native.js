import { Capacitor } from '@capacitor/core'

const isNative = () => Capacitor.isNativePlatform()

function dataUrlToBase64(dataUrl) {
  return dataUrl.substring(dataUrl.indexOf(',') + 1)
}

export async function saveImageNative(dataUrl, fileName) {
  const { Media } = await import('@capacitor-community/media')
  const perm = await Media.requestPermissions()
  if (perm.publicStorage !== 'granted' && perm.publicStorage !== 'limited') {
    throw new Error('permission-denied')
  }
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const tmp = await Filesystem.writeFile({
    path: fileName,
    data: dataUrlToBase64(dataUrl),
    directory: Directory.Cache,
  })
  await Media.savePhoto({ path: tmp.uri })
  await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache })
}

export async function copyImageNative(dataUrl, fileName) {
  const { Filesystem, Directory } = await import('@capacitor/filesystem')
  const { Share } = await import('@capacitor/share')
  const tmp = await Filesystem.writeFile({
    path: fileName,
    data: dataUrlToBase64(dataUrl),
    directory: Directory.Cache,
  })
  await Share.share({ url: tmp.uri })
}

export async function copyTextNative(text) {
  const { Clipboard } = await import('@capacitor/clipboard')
  await Clipboard.write({ string: text })
}

export { isNative }
