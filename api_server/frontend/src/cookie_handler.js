function putCookie(key, value, maxAge = 2592000000, path = '/', ) {
    if (key != 'login_token')
        if (!getCookie('allow_cookies'))
            return value
    document.cookie = `${key}=${value};path=${path};max-age=${maxAge}`;
    return value
}

function getCookie(name, default_value) {
    console.log('[getCookie] called',document.cookie)
    const value = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))?.split('=')[1]
    if (value == undefined) return default_value
    if (value == 'true') return true
    if (value == 'false') return false
    return value
}

export {putCookie, getCookie}