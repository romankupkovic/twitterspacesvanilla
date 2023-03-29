$(document).ready(function() {
    loadGlobalCache();
    $('#searchButton').click(function() {
        let query = $('#searchInput').val();
        let stateFilter = $('#stateFilter').val();
        searchTwitterSpaces(query, stateFilter);
    });
});

$('#searchInput').keypress(function(event) {
    if (event.which == 13) { 
        event.preventDefault();
        $('#searchButton').click();
    }
});

function loadGlobalCache() {
    $.ajax({
        url: '/global_cache',
        method: 'GET',
        success: function(response) {
            if (!response || response.length === 0) {
                showNotification('No spaces found in top spaces.', 3000);
                return;
            }

            renderResults({ data: response });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            showNotification('Error fetching top spaces.', 3000);
        }
    });
}


function searchTwitterSpaces(query, stateFilter) {
    // Set the search button to a loading state
    $('#searchButton').prop('disabled', true).text('Loading...');

    let timeout = setTimeout(() => {
        $('#searchButton').prop('disabled', false).text('Search');
        showNotification('Request timed out.', 3000);
    }, 4000);

    $.ajax({
        url: '/search',
        method: 'GET',
        data: {
            query: query || 'e',
            state: stateFilter,
            'space.fields': 'id,creator_id,title,participant_count',
            expansions: 'creator_id',
            max_results: 100
        },
        success: function(response) {
            clearTimeout(timeout);

            if (!response.data || response.data.length === 0) {
                showNotification('No spaces found.', 3000);
                $('#searchButton').prop('disabled', false).text('Search');
                return;
            }

            let spaces = response.data;
            spaces.sort((a, b) => b.participant_count - a.participant_count);
            spaces = spaces.slice(0, 50);

            renderResults({ data: spaces, includes: response.includes });
            $('#searchButton').prop('disabled', false).text('Search');
        },
        error: function(jqXHR, textStatus, errorThrown) {
            clearTimeout(timeout);

            showNotification('Error fetching data.', 3000);
            $('#searchButton').prop('disabled', false).text('Search');
        }
    });
}

function showNotification(message, duration = 3000) {
    $("#notificationMessage").text(message);
    $("#notification").fadeIn(200);

    setTimeout(function () {
        $("#notification").fadeOut(200);
    }, duration);
}

function renderResults(response) {
    $('#resultsList').empty();

    let spaces = response.data;
    let users = response.includes?.users;

    spaces.forEach(space => {
        let creator = users ? users.find(user => user.id === space.creator_id) : null;
        let creatorUsername = creator ? creator.username : (space.creator_username ? space.creator_username : ' ');

        if (!creatorUsername) {
            showNotification(`Creator not found for space with creator_id: ${space.creator_id}`, 3000);
            return;
        }

        let listItem = $('<li>');

        let spaceTitle = $('<span>').addClass('space-title').text(`${space.title} by @${creatorUsername}`);
        listItem.append(spaceTitle);

        let spaceParticipants = $('<span>').addClass('space-participants').text(`${space.participant_count} 👤`);
        listItem.append(spaceParticipants);

        let spaceLink = $('<a>')
            .attr('href', `https://twitter.com/i/spaces/${space.id}`)
            .attr('target', '_blank')
            .addClass('space-link')
            .text('Join Space');
        listItem.append(spaceLink);

        $('#resultsList').append(listItem);
    });

    showNotification('Results updated.', 3000);
}

