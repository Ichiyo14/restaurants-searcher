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

async function getCorrectAdress (latLng) {
  const client = new Client({})
  const res = await client
    .geocode({
      params: {
        latlng: latLng,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'ja'
      }
    })
  return res.data.results[0].formatted_address
}

async function getNear (latLng) {
  const client = new Client({})
  const res = await client
    .placesNearby({
      params: {
        location: latLng,
        key: process.env.GOOGLE_MAPS_API_KEY,
        radius: 100,
        type: 'restaurant',
        language: 'ja'
      }
    })
  return res.data.results
}

const printFirstSession = (correctAdress, nearStoresData) => {
  console.log('検索している住所は' + correctAdress + 'です。')
  console.log(nearStoresData.length)
}

const PlaceIdFromNearStoresData = (nearStoresData) => {
  const arrayOfPlaceId = []
  nearStoresData.forEach(storeData => {
    arrayOfPlaceId.push(storeData.place_id)
  })
  return arrayOfPlaceId
}

async function getDetailStoresData (placeId) {
  const client = new Client({})
  const res = await client
    .placeDetails({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'ja'
      }
    })
  return res.data.result
}

const detailedDataOfArrayOfPlaceId = async (arrayOfPlaceId) => {
  const detailedData = []
  for (const placeId of arrayOfPlaceId) {
    detailedData.push(await getDetailStoresData(placeId))
  }
  return sortByRating(detailedData)
}

const printAllStoresData = (detailedData) => {
  for (const storeData of detailedData) {
    console.log(storeData.name)
    console.log(storeData.opening_hours.open_now ? '営業中' : '閉店中')
    console.log(storeData.vicinity)
    console.log(storeData.formatted_phone_number)
    console.log(storeData.url)
    console.log(storeData.rating)
    console.log(storeData.user_ratings_total)
    console.log(storeData.opening_hours.weekday_text)
    console.log(storeData.opening_hours.periods)
    console.log('-----------------------')
  }
}

function sortByRating (detailedData) {
  return detailedData.sort(function (a, b) {
    if (a.rating > b.rating) { return -1 }
    if (a.rating < b.rating) { return 1 }
    return 0
  })
}

async function main (address) {
  const latLng = await getLatLngFromAboutAddress(address)
  const correctAdress = await getCorrectAdress(latLng)
  const nearStoresData = await getNear(latLng)
  printFirstSession(correctAdress, nearStoresData)
  const arrayOfPlaceId = PlaceIdFromNearStoresData(nearStoresData)
  const detailedData = await detailedDataOfArrayOfPlaceId(arrayOfPlaceId)
  printAllStoresData(detailedData)
}

main(address)
