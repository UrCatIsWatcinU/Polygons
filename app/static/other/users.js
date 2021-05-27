tasks.push(() => {
    document.querySelectorAll('.user-in-list-btns').forEach(btns => {
        const userElem = btns.parentElement;
        const actions = {
            delete: () => {
                showAsk(() => {
                    fetch('/users/delete/' + userElem.id.replace('u', ''), {
                        method: 'DELETE'
                    })
                    .then(res => {
                        if(res.ok) return res.json();
                        else showModal('Cannot delete user', 'Status ' + res.statusText);
                    })
                    .then(res => {
                        if(res && res.success) userElem.remove();
                        else showModal('Cannot delete user', '');
                    })
                    .catch(err => showModal('Cannot delete user', err));
                }, 'If you delete user, all his changes will be deleted with him. You will not be able to undo this action')
            },
            changeV: () => {
                fetch(`/users/${userElem.id.replace('u', '')}/change_visibility`, {
                    method: 'PUT'
                })
                .then(res => {
                    if(res.ok) return res.json();
                    else showModal('Cannot change visibility of user', 'Status: ' + res.statusText);
                })
                .then(res => {
                    if(res && res.success) userElem.classList.toggle('user-in-list-hidden');
                    else showModal('Cannot change visibility of user', '');
                })
                .catch(err => showModal('Cannot change visibility of user', err))
            },
            ban: () => {
                fetch(`/users/${userElem.id.replace('u', '')}/ban`)
                .then(res => res.ok && res.json())
                .then(res => {
                    if(!res || res.success) return showModal('An error while banning user', translate('ptl'));
                })
                .catch(err => showModal('An error while banning user', err))
            }
        }
        
        for(let action in actions){
            btns.querySelector('.user-in-list-' + action).onclick = actions[action];
        }
    });

    document.querySelector('.user-toggle-visibility').onclick = () => {
        fetch('/users/i/change_visibility', {
            method: 'PUT'
        })
        .then(res => {
            if(res.ok) return res.json()
        })
        .then(res => {
            if(res.success) window.location.reload();
        })
    }

    const maxRoleSize = Math.max(...Array.from(document.querySelectorAll('.role')).map(role => role.offsetWidth));

    const usersCssProps = {
        'role-size': maxRoleSize + 'px',
        'me-bgc': hexToRgb(colors.MAIN_C, .06)
    }

    setCSSProps(usersCssProps);
});