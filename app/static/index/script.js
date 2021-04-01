let isHexagonActive = false;

function rgbToHex(r, g, b) {
    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

window.addEventListener('load', async () => {
    const createEditedField = (hexagon, needToSend = true) => {
        let editedField = hexagon.querySelector('.hexagon-editedField');
        if(!editedField){
            editedField = document.createElement('div');
            editedField.className = 'hexagon-editedField';
            
            
            hexagon.append(editedField);
        }

        editedField.onfocus = () => {    
            isHexagonActive = true;
            let oldName = editedField.innerText;
            
            editedField.onblur = async () => {
                editedField.setAttribute('contenteditable','false');
                hexagon.classList.remove('hexagon-active');

                isHexagonActive = false;
                if(needToSend && editedField.innerText && editedField.innerText != oldName){
                    try{
                        let res = await fetch('/categ/change', {
                            method: 'POST',
                            body: JSON.stringify({
                                name: editedField.innerText.trim(),
                                oldName: oldName, 
                                color: hexagon.style.getPropertyValue('--bgc').replace('#', '').trim(),
                                textColor: rgbToHex(...getComputedStyle(editedField).color.replace('rgb(', '').replace(')', '').split(/\s*,\s*/).map(elem => +elem)).replace('#', '')
                            })
                        })

                        if(res.ok){
                            res = await res.json();
                            if(!res.success){
                                showModal("Couldn't change category", 'An error occurred while changing the category');
                            }
                        }else{
                            showModal("Couldn't change category", 'An error occurred while changing the category');
                        }
                    }catch(err){
                        showModal("Couldn't change category", 'An error occurred while changing the category');
                    }
                }
            }
        }
        return editedField;
    }

    document.addEventListener('click', evt => {
        document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
    })
    
    document.body.oncontextmenu = (evt) => {
        document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});
        window.onscroll = () => {document.querySelectorAll('.contextmenu').forEach(elem => {elem.remove()});}

        let hexagon = document.elementFromPoint(evt.clientX, evt.clientY);
        if(hexagon == document.body) return false;
        while(!hexagon.classList.contains('hexagon')){
            hexagon = hexagon.parentElement;
            if(hexagon == document.body) return false;
        }

        let contextmenu  = document.createElement('div');
        contextmenu.className = 'contextmenu';

        contextmenu.onclick = null;
        
        let user = JSON.parse(sessionStorage.getItem('user'));
        if(user.userRole != 2) return false
        contextmenu.innerHTML = '<div class="contextmenu-item">Delete</div>';

        contextmenu.firstElementChild.onclick = () => {
            showAsk(() => {     
                fetch('/categ/delete/' + hexagon.innerText, {method: 'DELETE'});
                window.location.reload();
            })
        }

        contextmenu.style.top = evt.clientY + 'px';
        contextmenu.style.left = evt.clientX + 'px';
        document.body.append(contextmenu);

        return false
    }

    let categs = Array.from(document.querySelectorAll('.categ'))
    categs.forEach(categ => {
        let polygon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        polygon.classList.add('polygon');
        polygon.innerHTML = `<svg class="polygon"> 
            <polygon points="0,${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},0 ${HEXAGON_WIDTH},${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH},${HEXAGON_HEIGHT-TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},${HEXAGON_HEIGHT} 0,${HEXAGON_HEIGHT-TRIANGLE_HEIGHT}"></polygon>
        </svg>`;

        categ.prepend(polygon);

        categ.addEventListener('click', async (evt) => {
            if(evt.ctrlKey || evt.metaKey){
                let user = JSON.parse(sessionStorage.getItem('user') || '{}')
                if(user.userRole != 2) return
                evt.preventDefault();
                evt.stopImmediatePropagation();

                categ.classList.add('hexagon-active');   
                
                let editedField = createEditedField(categ);
                
                editedField.setAttribute('contenteditable','true');
                editedField.focus();
            }
            
        }, {passive:false, capture:true});

        categ.addEventListener('click', () => {
            if(!isHexagonActive){
                window.location.href = '/fields/' + categ.innerText;
            }
        })
    })

    let rows = Array.from(document.querySelectorAll('.row'));
    for(let i = 0; i < rows.length; i++){
        if(i % 2 != 0){
            rows[i].classList.add('row-moved');
        }
    }

    let user = null;
    let userRes = await fetch('/users/i');
    if(userRes.ok){
        if(!userRes.message){
            userRes = await userRes.text()
            sessionStorage.setItem('user', userRes)
            user = JSON.parse(userRes)
        }
    }

    // отрисовка плюса для создания категорий
    if(user && user.userRole == 2){
        let isNewCateg = false;

        let plus = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        plus.classList.add('categs-plus');
        plus.innerHTML = `<line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line>`;
        if(!document.querySelector('.categs').lastElementChild){
            document.querySelector('.categs').innerHTML = '<div class="row"></div>'
        }
        document.querySelector('.categs').lastElementChild.append(plus);
        
        plus.addEventListener('click', () => {
            if(isNewCateg) return;

            showModal('', '', true);

            let modal = document.querySelector('.modal-content');
            modal.classList.add('new-categ-modal');

            modal.innerHTML = '<div class="row"></div>'

            isNewCateg = true;
            let newCateg = document.createElement('div');
            newCateg.className = 'categ hexagon new';
            newCateg.innerHTML =   `<svg class="polygon"> 
            <polygon points="0,${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},0 ${HEXAGON_WIDTH},${TRIANGLE_HEIGHT} ${HEXAGON_WIDTH},${HEXAGON_HEIGHT-TRIANGLE_HEIGHT} ${HEXAGON_WIDTH/2},${HEXAGON_HEIGHT} 0,${HEXAGON_HEIGHT-TRIANGLE_HEIGHT}"></polygon>
            </svg>
            <div class="newCategPieces">
                <label for="bgc">Background</label> <input id="bgc" class='picker bgc-picker' value="${colors.BLACK_C}" data-jscolor="{}">
                <label for="fgc">Foreground</label> <input id="fgc" class='picker fgc-picker' value="${colors.BODY_BGC}" data-jscolor="{}">
                <label for="size">Size</label> <input id="size" class='param new-categ-size' value="30x40">
                <label for="maxWords">Max words count</label> <input id="maxWords" class='param new-categ-maxWords' value="5">
                <button class="create-categ">Create</button>
                <button class="create-categ">Cancel</button>
            </div>`;
            newCateg.style.setProperty('--bgc', colors.BLACK_C);
            
            
            
            modal.querySelector('.row').append(newCateg);
            let editedField = createEditedField(newCateg);
            editedField.onfocus = null;
            editedField.onblur = null;

            jscolor.install();
            let bgc = colors.BLACK_C;
            let fgc = colors.BODY_BGC;
            newCateg.querySelector('.bgc-picker').onchange = (evt) => {
                newCateg.style.setProperty('--bgc', evt.target.value);
                bgc = evt.target.value;
            }
            newCateg.querySelector('.fgc-picker').onchange = (evt) => {
                editedField.style.color = evt.target.value;
                fgc = evt.target.value;
            }
            
            newCateg.addEventListener('dblclick', (evt) => {
                evt.preventDefault();
                evt.stopImmediatePropagation();

                newCateg.classList.add('hexagon-active');   
                
                let editedField = createEditedField(newCateg, false);
                
                editedField.setAttribute('contenteditable','true');
                editedField.focus();
            
            }, {passive:false, capture:true})

            newCateg.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.parentElement.style.display = 'none';
                    modal.classList.remove('new-categ-modal');
                    isNewCateg = false;
                })
            })
            newCateg.querySelector('.create-categ').onclick = async () => {
                if(!editedField.innerText) return;

                let params = {};
                Array.from(newCateg.querySelectorAll('.param')).forEach(param => {
                    params[param.id] = param.value;
                })

                if(!params.size.match(/\d{1,3}[xх\s]\d{1,3}/) || !params.maxWords.match(/\d+/) ) return;

                newCateg.querySelector('.newCategPieces').remove();
                let res = await fetch('/categ/new', {
                    method:'POST',
                    body:JSON.stringify({
                        name: editedField.innerText.trim(),
                        color: bgc.replace('#', '').trim(),
                        textColor: fgc.replace('#', ''),
                        params: JSON.stringify(params)
                    })
                })

                if(!res.ok){
                    showModal("Couldn't create category", 'An error occurred while creating the category');
                }else{
                    res = await res.json();
                    if(!res.success){
                        showModal('Error', res.message)
                    }
                }
                window.location.reload()
            }
        })
    }
})