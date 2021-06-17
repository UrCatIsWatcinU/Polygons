
tasks.push(() => {
    const ownerId = window.location.href.match(/\d+$/)[0];
    document.body.style.setProperty('--max-row-w', document.querySelector('.user-content').offsetWidth + 'px');
    const num = document.querySelector('.user-rating-num');

    if(+num.innerHTML > 0){
        num.classList.add('rating-positive');
    }else if(+num.innerHTML < 0){
        num.classList.add('rating-negative');
    }

    document.querySelector('.user-rating-cont').onclick = evt => {
        if(evt.target.classList.contains('user-rating-btn')){
            const btn = evt.target;

            let change = 0;
            if(btn.classList.contains('rating-plus')){
                change++;
            }else{
                change--;
            }

            fetch(`/users/${document.querySelector('.user-id').innerText}/rating/change`, {
                method: 'POST',
                body: JSON.stringify({
                    change: change
                })
            }).then(async res =>{
                if(!res.ok) return;
                res = await res.json();
                
                const plus = document.querySelector('.rating-plus');
                const minus = document.querySelector('.rating-minus');
                if(res.success){
                    if(res.change == -1){
                        minus.style.opacity = 0;
                        minus.style.pointerEvents = 'none';
                        
                        plus.style.opacity = 1;
                        plus.style.pointerEvents = 'auto';
                    }else if(res.change == 1){
                        plus.style.opacity = 0;
                        plus.style.pointerEvents = 'none';

                        minus.style.opacity = 1;
                        minus.style.pointerEvents = 'auto';
                    }else if(res.change == 0){
                        [minus, plus].forEach(b => {
                            b.style.opacity = 1;
                            b.style.pointerEvents = 'auto';
                        });
                    }

                    num.innerText = res.num ? res.num : '0';

                    if(res.num > 0){
                        num.classList.add('rating-positive');
                    }else if(res.num < 0){
                        num.classList.add('rating-negative');
                    }else{
                        num.classList.remove('rating-negative');
                        num.classList.remove('rating-positive');
                    }
                }else{
                    change = 0;
                }
            });
        }
    }

    document.querySelectorAll('.hexagon').forEach(setHexVisible);

    const actions = {
        delete: () => {
            showAsk(() => {
                fetch('/users/delete/i', {
                    method: 'DELETE'
                })
                .then(res => {
                    if(res.ok) return res.json();
                    else showModal('An error occurred when deleting the profile', 'Please, try later. Status: ' + res.status);
                })
                .then(res => {
                    if(res && res.success) window.location.href = '/';
                    else showModal('An error occurred when deleting the profile', 'Please, try later.');
                })
                .catch(err => showModal('An error occurred when deleting the profile', err));

            }, 'You will not be able to cancel this action. Now, if you delete your account nobody can\'t restore it')
        },
        chat: () => {
            window.location.href = '/chats?with=' + ownerId;
        },
        subscribe: () => {
            fetch(`/users/${ownerId}/subscribe`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res || !res.success) return showModal('An error occured while subscribing to a user', translate('ptl'));

                window.location.reload();
            });
        },
        unsubscribe: () => {
            fetch(`/users/${ownerId}/unsubscribe`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res || !res.success) return showModal('An error occured while subscribing to a user', translate('ptl'));

                window.location.reload();
            });
        },
        subs: () => {
            fetch(`/users/subscribers`)
            .then(res => res.ok && res.json())
            .then(res => {
                if(!res) showModal('An error occured while loading subscribers', translate('ptl'));

                const subsStr = res.map(sub => `<li class="subs-subCont"><div class="subs-sub">
                    <a href="/users/${sub.user.id}" class="username">${sub.user.username}</a>
                </div></li>`);
                const subscribersList = showModal('', '', true);
                subscribersList.innerHTML = `<div class="modal-content subs">
                    <h1 class="subs-title modal-title">${translate('subs.title')}</h1>
                    <svg class="complaint-close"><line x1="50%" y1="0%" x2="50%" y2="100%"></line><line x1="0%" y1="50%" x2="100%" y2="50%"></line></svg>
                    <ol class="subs-content">
                        ${subsStr}
                    </ol>
                    <div class="btn-cont" style="display: flex;">
                        <button class="close-button">${translate('btns.close')}</button>
                    </div>
                <div>`;

                subscribersList.querySelector('.close-button').onclick = subscribersList.querySelector('.complaint-close').onclick = hideModal;

            });
        }
    }

    for(let action in actions){
        const btn = document.querySelector('.user-' + action);
        if(btn){
            btn.onclick = actions[action];
        }
    }
});