import { useEffect, useState } from "react";
import axios from 'axios';
import classes from './Weather.module.css'

import bcgThunder from '../images/thunder.jpg'
import bcgRain from '../images/rain.jpg'
import bcgSnowD from '../images/day/snow.jpg'
import bcgSnowN from '../images/night/snow.jpg'
import bcgD from '../images/day/clear.jpg'
import bcgN from '../images/night/clear.jpg'
import bcgCloudD from '../images/day/clouds.jpg'
import bcgCloudN from '../images/night/clouds.jpg'
import arrow from '../images/arrow.png'


const API_KEY = "c6dea39f86ea31dc114f0a4f0eec8fa9";

type TWeather = {
    temperature: string,
    temps: string,
    detail: string,
    humidité: string,
    vent: {
        vitesse: string,
        degre: string,
    },
}

type TbackG = {
    backgroundImage?: string,
    backgroundSize: string,
    backgroundRepeat: string,
    backgroundPosition?: string,
    transition?: string,
}

const defaultWeather: TWeather = {
    temperature: '',
    temps: '',
    detail: '',
    humidité: '',
    vent: {
        'vitesse': '',
        'degre': '',
    }
}

export const Weather = () => {
    const [weather, setWeather] = useState<TWeather>(defaultWeather)
    const [city, setCity] = useState('')
    const [erreurs, setErreurs] = useState('')

    useEffect(() => {
        pos()
    }, [])
    
    // Initialise le 'cache' ou récupère les données si déjà initialisé
    const initCache = (coord: number[]) => {
        let date =  Date.now()
        let changement = false

        // Si déjà initialisé
        if (localStorage.getItem('latitude')) {
            const latStr: string | null = localStorage.getItem('latitude');
            let lat: number | null = latStr !== null ? parseFloat(latStr) : null

            const longStr: string | null = localStorage.getItem('longitude');
            let long: number | null = longStr !== null ? parseFloat(longStr) : null

            const dateReqStr: string | null = localStorage.getItem('date');
            let dateReq: number | null = dateReqStr !== null ? parseFloat(dateReqStr) : null

            // Conditions pour une nouvelle requête
            if (
                (lat !== null && (lat - coord[0] > 0.027 || lat - coord[0] < -0.027)) || 
                (long !== null && (long - coord[1] > 0.04 || long - coord[1] < -0.04)) ||
                (dateReq !== null && date - dateReq > 900000)

            ) {
                localStorage.setItem('latitude', String(coord[0]))
                localStorage.setItem('longitude', String(coord[1]))
                localStorage.setItem('date', `${date}`)
                changement = true

            }else {
                const temperatureStr = localStorage.getItem('temperature')
                const tempsStr = localStorage.getItem('temps')
                const detailStr = localStorage.getItem('detail')
                const humiditeStr = localStorage.getItem('humidité')
                const ventVStr = localStorage.getItem('ventV')
                const ventDStr = localStorage.getItem('ventD')
                const cityStr = localStorage.getItem('city')
            
                if (temperatureStr !== null && tempsStr !== null && detailStr !== null && humiditeStr !== null && ventVStr !== null && ventDStr !== null && cityStr !== null) {

                    let meteo = {
                        'temperature': temperatureStr,
                        'temps': tempsStr,
                        'detail': detailStr,
                        'humidité': humiditeStr,
                        'vent': {
                            'vitesse': ventVStr,
                            'degre': ventDStr
                        }
                    }
                    setWeather(meteo)
                    setCity(cityStr)
                }
            }
        } else {
            localStorage.setItem('latitude', String(coord[0]))
            localStorage.setItem('longitude', String(coord[1]))
            localStorage.setItem('date', `${date}`)
            changement = true
        }
        
        if (changement) {
            getWeather()
        }
    }
    
    // Récupère les coordonnées
    const pos = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                let coord = [position.coords.latitude, position.coords.longitude]
                initCache(coord)
            },
            (error) => {
                setErreurs('Veuillez accepter l\'accées aux coordonnées s\'il vous plait.')
            }
        )
        }else {
            setErreurs('Localisation impossible')
        }
    }

    // Requête API
    const getWeather = async () => {
        if (localStorage.getItem('latitude') == null) {
            setErreurs("Erreur lors de la lecture des coordonnées.")
        }

        let latitude = localStorage.getItem('latitude')
        let longitude = localStorage.getItem('longitude')

        await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                lat: latitude,
                lon: longitude,
                appid: API_KEY,
                units: 'metric',
                lang: 'fr',
            }
        })
        .then(response => {
            let vent = {
                'vitesse': response.data.wind.speed,
                'degre': response.data.wind.deg,
            }
            let meteo = {
                'temperature': response.data.main.temp,
                'temps': response.data.weather[0].main,
                'detail': response.data.weather[0].description,
                'humidité': response.data.main.humidity,
                'vent': vent,
            }

            localStorage.setItem('temperature', response.data.main.temp)
            localStorage.setItem('temps', response.data.weather[0].main)  
            localStorage.setItem('detail', response.data.weather[0].description)
            localStorage.setItem('humidité', response.data.main.humidity)
            localStorage.setItem('ventV', vent.vitesse)
            localStorage.setItem('ventD', vent.degre)
            localStorage.setItem('city', response.data.name)

            setWeather(meteo)
        }).catch(error => {
            let errorMsg = "Erreur lors de la requête"
            if (error.response) {
                errorMsg += " : "+error.response.status
            }
            setErreurs(errorMsg)
        })
    }

    // Affichage des données
    const display = () => {
        let date = new Date
        if (weather !== defaultWeather) {
            return (
                <div className={classes.container}>
                    <p className={classes.titre}>Votre Position</p>
                    <p className={classes.position}>{city}</p>
                    <div className={classes.infos}>
                        <p className={classes.degre}>{weather.temperature}°C</p>
                        <div className={classes.details}>
                            <p>{date.getHours()+":"+date.getMinutes()}</p>
                            <p>Temps: {weather.detail}</p>
                            <p>Humidité: {weather.humidité}%</p>
                            <p>
                                Vent: <span><img src={arrow} className={classes.arrow} style={{transform: `rotate(${weather.vent.degre}deg)`}}/></span>
                                {weather.vent.vitesse+"m/s"}
                            </p>
                        </div>
                    </div>
                    <button onClick={()=>pos()}>Voir la météo</button>
                </div>
            )
        } else {
            return (
                <>
                    <p className={classes.dateDE}>{date.getHours()+":"+date.getMinutes()}</p>
                    <p className={classes.textDE}>{erreurs !== '' ? erreurs : 'Votre position..'}</p>
                </>
            )
        }
    }

    // Style du background
    const styleBcg = () => {
        let bgImage: TbackG = {
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transition: 'opacity 0.5s ease-in-out;'
        }
        let date = new Date()
        let heure = date.getHours()
        switch (weather.temps) {
            case 'Thunderstorm':
                return {
                    backgroundImage: `url(${bcgThunder})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                }
            case 'Drizzle':
            case 'Rain':
                return {
                    backgroundImage: `url(${bcgRain})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                }
            case 'Snow':
                if (heure <= 8 || heure >= 20) {
                    bgImage = {
                        ...bgImage,
                        backgroundImage: `url(${bcgSnowN})`,
                        backgroundPosition: 'left'
                    }
                } else {
                    bgImage = {
                        ...bgImage,
                        backgroundImage: `url(${bcgSnowD})`,
                    }
                }
                return bgImage
            case 'Clouds':
                if (heure <= 8 || heure >= 20) {
                    bgImage = {
                        ...bgImage,
                        backgroundImage: `url(${bcgCloudN})`,
                        backgroundPosition: 'center'
                    }
                } else {
                    bgImage = {
                        ...bgImage,
                        backgroundImage: `url(${bcgCloudD})`,
                    }
                }
                return bgImage           
            default:
                if (heure <= 8 || heure >= 20) {
                    bgImage = {
                        ...bgImage,
                        backgroundImage: `url(${bcgN})`,
                    }
                } else {
                    bgImage = {
                        ...bgImage,
                        backgroundImage: `url(${bcgD})`,
                    }
                }
                return bgImage
        }
    }

    return (
        <div className={classes.Weather} style={styleBcg()}>
            {display()}
        </div>
    );


};
