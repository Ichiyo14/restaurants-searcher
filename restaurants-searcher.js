const { Client } = require('@googlemaps/google-maps-services-js')
const argv = require('minimist')(process.argv.slice(2))
const address = argv._[0]
const defaultRadius = 100
const radius = (argv.r >= 10000 ? 10000 : argv.r) || defaultRadius

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

async function getNear (latLng, radius) {
  const client = new Client({})
  let res = await client
    .placesNearby({
      params: {
        location: latLng,
        key: process.env.GOOGLE_MAPS_API_KEY,
        radius: radius,
        type: 'restaurant',
        language: 'ja'
      }
    })
  let nextPageToken = res.data.next_page_token
  let nearStoresData = res.data.results
  while (hasProperty(res.data, 'next_page_token')) {
    const wait = (sec) => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, sec * 1000)
      })
    }
    await wait(3)
    res = await client
      .placesNearby({
        params: {
          location: latLng,
          key: process.env.GOOGLE_MAPS_API_KEY,
          radius: radius,
          type: 'restaurant',
          language: 'ja',
          pagetoken: nextPageToken
        }
      })
    nearStoresData = nearStoresData.concat(res.data.results)
    if (hasProperty(res.data, 'next_page_token')) { nextPageToken = res.data.next_page_token }
  }
  return nearStoresData
}

const hasProperty = (obj, key) => {
  return !!(obj) && Object.prototype.hasOwnProperty.call(obj, key)
}

const printFirstSession = (nearStoresData, radius) => {
  console.log('周辺' + radius + 'mにあるお店は' + nearStoresData.length + ((nearStoresData.length >= 60) ? '店以上です。' : '店です。'))
}

const PlaceIdFromNearStoresData = (nearStoresData) => {
  const arrayOfPlaceId = []
  for (const storeData of nearStoresData) {
    if (storeData.place_id === undefined) { continue }
    arrayOfPlaceId.push(storeData.place_id)
  }
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

const printStoresData = async(detailedData) => {
  for (const storeData of detailedData) {
    console.log('店舗名:' + storeData.name)
    console.log('住所:' + storeData.vicinity)
    console.log('電話番号:' + storeData.formatted_phone_number)
    console.log('URL:' + storeData.url)
    console.log('評価:' + storeData.rating + '/5.0')
    console.log('評価数:' + storeData.user_ratings_total)
    if (storeData.opening_hours === undefined) {
      console.log('---------------------------------------------')
      continue
    }
    console.log(storeData.opening_hours.open_now ? '営業中' : '閉店中')
    console.log('-------------------営業時間-------------------')
    storeData.opening_hours.weekday_text.forEach(element => {
      console.log(element)
    })
    console.log('---------------------------------------------')
  }
}

function sortByRating (detailedData) {
  return detailedData.sort(function (a, b) {
    if (a.rating > b.rating) { return -1 }
    if (a.rating < b.rating) { return 1 }
    return 0
  })
}

const lunchTimeStores = []
const dinnerTimeStores = []

const normallyOpenForLunch = (periods) => {
  return periods.some(x => x.open.time <= 1200)
}
const normallyOpenForDinner = (periods) => {
  for (const state of periods) {
    if (!state.hasOwnProperty('close')) {
    return true
  }
}
  return periods.some(x => (x.open.time <= 1800) && (x.close.time >= 1900))
}
const openTime = (detailedData) => {
  for (const storeData of detailedData) {
    if (storeData.opening_hours === undefined) { continue }
    console.log(storeData.opening_hours.periods)
    if (normallyOpenForLunch(storeData.opening_hours.periods)) { lunchTimeStores.push(storeData) }
    if (normallyOpenForDinner(storeData.opening_hours.periods)) { dinnerTimeStores.push(storeData) }
  }
}

function padStartWithBlank (number, length) {
  return number.toString().padStart(length, ' ')
}

const printChoises = async (detailedData) => {
  console.log('ランチ:  ' + (padStartWithBlank(lunchTimeStores.length, 3)) + '店')
  console.log('ディナー:' + (padStartWithBlank(dinnerTimeStores.length, 3)) + '店')
  const { Select } = require('enquirer')
  const prompt = new Select({
    message: 'どの時間帯のレストラン情報をみたいですか？',
    choices: ['全レストラン', 'ランチ', 'ディナー']
  })
  try {
    const answer = await prompt.run()
    if (answer === '全レストラン') { printStoresData(detailedData) }
    if (answer === 'ランチ') { printStoresData(lunchTimeStores) }
    if (answer === 'ディナー') { printStoresData(dinnerTimeStores) }
  } catch {
  }
}

async function main (address, radius) {
  const latLng = await getLatLngFromAboutAddress(address)
  const correctAdress = await getCorrectAdress(latLng)
  console.log('検索している住所は' + correctAdress + 'です。')
  const nearStoresData = await getNear(latLng, radius)
  printFirstSession(nearStoresData,radius)
  // console.log(nearSoresData)
  const arrayOfPlaceId = PlaceIdFromNearStoresData(nearStoresData)
  const detailedData = await detailedDataOfArrayOfPlaceId(arrayOfPlaceId)
  openTime(detailedData)
  printChoises(detailedData)
}

main(address, radius)
