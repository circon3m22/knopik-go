export function loginFailureMessage(error:unknown){
 const e=(error&&typeof error==='object'?error:{}) as {code?:string;status?:number;name?:string};
 if(e.code==='invalid_credentials')return 'Неверный логин или пароль.';
 if(e.status===429||e.code==='over_request_rate_limit')return 'Слишком много попыток. Подожди немного и войди снова.';
 if(e.code==='email_not_confirmed'||e.code==='user_banned')return 'Вход в аккаунт сейчас недоступен. Обратись к администратору.';
 if(e.status&&e.status>=500)return 'Сервер входа временно недоступен. Попробуй ещё раз.';
 if(!e.status||e.name==='AuthRetryableFetchError'||e.name==='AbortError')return 'Не удалось связаться с сервером. Проверь интернет и повтори вход.';
 return 'Не удалось войти. Повтори попытку; если ошибка сохраняется, обратись к администратору.';
}
