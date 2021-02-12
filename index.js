function verificarOrientacao(e, callback){

    if (e.matches){

        orientacao = "portrait";

        callback();

    } else{

        orientacao = "landscape"

    }

}

function capitalize(texto){

    return texto.charAt(0).toUpperCase() + texto.slice(1)

}

function verificarNomeCidade(nomeCidade){

    if (nomeCidade == false){tratarErro("inputVazio"); return true} 

    for (let i = 0; i < cidadesPesquisadas.length; i++){

        if (nomeCidade == cidadesPesquisadas[i]){

            tratarErro("cidadeJaPesquisada");
            limparInput();
            return true;

        }

    }

    return false;

}

function tratarErro(codigoErro){

    const mensagensDeErro = {

        404: "Cidade não encontrada!",
        inputVazio: "Você não digitou nenhuma cidade!",
        cidadeJaPesquisada: "Essa cidade já foi pesquisada"

    }

    $("div#msgErro>div") ? $("div#msgErro>div").remove() : "";

    $("div#msgErro").append($(`
    
    <div class="text-center alert alert-danger alert-dismissible" role="alert">
        ${mensagensDeErro[codigoErro]}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>

    `)).hide().fadeIn(300);

}

function limparInput(){

    $("input#cidade").val("")

}

function criarCartao(clima){

    const nomeCidadeClass = clima.nomeCidade.length >= 19 ? "fs-5" : "fs-4";

    if (orientacao == "portrait"){

        $("div#cartoes>div#conteudo>div.cartao").remove();
        cidadesPesquisadas.shift();

    }

    $(`<div class = "cartao text-white rounded my-2">
    
        <div id = "conteudo">

            <p class = "${nomeCidadeClass} text-center">${clima.nomeCidade}</p>

            <div class = "text-end" id = "temps">
                <p class = "fs-2">${clima.temp}°C</p>
                <p class = "tempMinMax">Min:${clima.temp_min}°C</p>
                <p class = "tempMinMax">Max:${clima.temp_max}°C</p>
            </div>

            <img class = "center" id = "tempoIcon" src = ${clima.iconUrl}>

            <p id = "descricao">${clima.descricao}</p>

        </div>

    </div>`).appendTo("div#cartoes>div#conteudo").hide().fadeIn(300);

    limparInput()

}

function excluirCartoes(){

    let cartoes = $("div#cartoes>div#conteudo>div.cartao");

    for (let i = 0; i < cartoes.length; i++){

        if (i >= cartoes.length-1){

            break;

        }

        cartoes[i].remove();
        cidadesPesquisadas.shift();

    }

}

const apiKey = "d7f4c82d800ee3b805b4eda5749983d9";

function obterCoordenadasPorGeoLocation(callback){

    if (navigator.geolocation){

        navigator.permissions.query({name:'geolocation'})
        .then((permissionStatus)=>{
            verificarPermissao(permissionStatus)
            permissionStatus.onchange = ()=> location.reload(true);
        })
    
    } else{

        console.log("Navegador não suporta GeoLocalização!")

    }

    function verificarPermissao(permissionStatus){

        if (permissionStatus.state == "prompt"){
            abrirJanela(
            "Permitir localização",
            "Permita acessarmos sua localização para que possamos exibir a temperatura em sua localização atual."
            )
        }

        navigator.geolocation.getCurrentPosition(
            function(position){

                const coords = {

                    lat: position.coords.latitude,
                    lon: position.coords.longitude,

                }

                obterNomeCidadePorCoordenadas(coords).then(nomeCidade=>{callback(coords, nomeCidade)});

            },
            function(error){

                console.log(error);

            }
        )
    }
}

function obterCoordenadasPorNomeCidade(nomeCidade, callback){

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${nomeCidade}&limit=1&appid=${apiKey}`
    const options = {method: "GET"};

    fetch(url,options)
    .then(res => res.json())
    .then(res =>{

        if (res.message){

            return tratarErro(res.cod);

        }

        let coords = {

            lat: res[0].lat,
            lon: res[0].lon

        }

        callback(coords, nomeCidade);

    })
    .catch(error => console.log(error))

}

function obterNomeCidadePorCoordenadas(coords){

    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${coords.lat}&lon=${coords.lon}&limit=1&appid=${apiKey}`
    const options = {method: "GET"};

    return fetch(url,options)
    .then(res => res.json())
    .then(res => {
    
        if (res.message){

            return tratarErro(res.cod);

        }
        
        return res[0].local_names.pt || res[0].name
    
    })
    .catch(error => console.log(error))

}

function obterClima(coords, nomeCidade){

    const apiUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${coords.lat}&lon=${coords.lon}&appid=${apiKey}&units=metric&lang=pt_br`
    const options = {method: "GET"};

    fetch(apiUrl, options)
    .then(res => res.json())
    .then(res => {
        
        if (res.message){

            return tratarErro(res.cod);

        }

        const clima = {

            nomeCidade: nomeCidade,
            temp: parseInt(res.hourly[0].temp),
            temp_min: parseInt(res.daily[0].temp.min),
            temp_max: parseInt(res.daily[0].temp.max),
            descricao: capitalize(res.hourly[0].weather[0].description),
            iconUrl: `https://openweathermap.org/img/wn/${res.hourly[0].weather[0].icon}@2x.png`,

        }

        criarCartao(clima);
        cidadesPesquisadas.push(nomeCidade)
    
    })
    .catch(error => console.log(error))

}

function abrirJanela(titulo,texto){

    $("div#janela>div")[0].classList.contains("show") ? $("button#fecharJanela")[0].click(): ""

    $("#titulo-janela").text(titulo);
    $("#texto-janela").text(texto);

    $("button#abrirJanela")[0].click();

}

function configurarBackground(){

    const hora = new Date().getHours();

    let bgUrl = "./img/dia.jpg";

    if (hora >= 18 || hora <= 6){

        bgUrl = "./img/noite.jpg";
        $("html").css("--bgColorCartao", "#212529");

    } 

    $("body").css("background-image", `url(${bgUrl})`);

}

let cidadesPesquisadas = [];
let orientacao;

const orientacaoMediaQuery = window.matchMedia("(orientation:portrait)");
orientacaoMediaQuery.addEventListener("change", (e)=>verificarOrientacao(e,excluirCartoes));
verificarOrientacao(orientacaoMediaQuery,excluirCartoes)
configurarBackground();

$("form").submit(function(event){

    event.preventDefault();

    let nomeCidade = $("input#cidade").val();

    if (verificarNomeCidade(nomeCidade) == true) return;
    obterCoordenadasPorNomeCidade(nomeCidade, obterClima);

})

window.onload = ()=>{

    obterCoordenadasPorGeoLocation(obterClima);

}
