const { Client } = require('@googlemaps/google-maps-services-js')
const address = require('minimist')(process.argv.slice(2))._[0]

async function getLatLngFromAboutAddress (address) {
  const client = new Client({})
  const res = await client
    .geocode({
      params: {
        address: address,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'ja'
      }
    })
  const lat = res.data.results[0].geometry.location.lat
  const lng = res.data.results[0].geometry.location.lng
  const latLng = `${lat},${lng}`
  return latLng
}

async function serchPoint (latLng) {
  const client = new Client({})
  const res = await client
    .geocode({
      params: {
        latlng: latLng,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'ja'
      }
    })
  console.log(res.data.results[0].formatted_address)
}

async function main (address) {
  const latLng = await getLatLngFromAboutAddress(address)
  serchPoint(latLng)
}
main(address)
