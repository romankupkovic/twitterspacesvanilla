$(document).ready(function() {
    $('#searchButton').click(function() {
        let query = $('#searchInput').val();
        let stateFilter = $('#stateFilter').val();
        searchTwitterSpaces(query, stateFilter);
    });
});

function searchTwitterSpaces(query, stateFilter) {
    // Set the search button to a loading state
    $('#searchButton').prop('disabled', true).text('Loading...');

    let timeout = setTimeout(() => {
        $('#searchButton').prop('disabled', false).text('Search');
    }, 4000);

    $.ajax({
        url: '/search',
        method: 'GET',
        data: {
            query: query || 'e', // Use the query or 'a e i o u' if no query is provided
            state: stateFilter,
            'space.fields': 'id,creator_id,title,participant_count', // Include the id, creator_id, title, and participant_count fields
            expansions: 'creator_id', // Include the creator_id expansion
            max_results: 100 // Fetch 100 spaces
        },
        success: function(response) {
            clearTimeout(timeout);

            if (!response.data || response.data.length === 0) {
                console.error('No spaces found in the response:', response);
                $('#searchButton').prop('disabled', false).text('Search');
                return;
            }

            let spaces = response.data;
            spaces.sort((a, b) => b.participant_count - a.participant_count);

            // Limit the results to 10 spaces with the highest participant_count
            spaces = spaces.slice(0, 50);

            renderResults({ data: spaces, includes: response.includes });
            // Reset the search button state
            $('#searchButton').prop('disabled', false).text('Search');
        },
        error: function(jqXHR, textStatus, errorThrown) {
            clearTimeout(timeout);

            console.error('Error fetching data:', textStatus, errorThrown);
            console.error('Response:', jqXHR.responseText);
            // Reset the search button state
            $('#searchButton').prop('disabled', false).text('Search');
        }
    });
}






function renderResults(response) {
    $('#resultsList').empty();

    let spaces = response.data;
    let users = response.includes?.users;

    if (!users) {
        console.error('No users found in the response:', response);
        return;
    }

    spaces.forEach(space => {
        let creatorId = space.creator_id;
        let creator = users.find(user => user.id === creatorId);

        if (!creator) {
            console.error(`Creator not found for space with creator_id: ${creatorId}`);
            return;
        }

        let listItem = $('<li>');
        
        let spaceTitle = $('<span>').addClass('space-title').text(`${space.title} by @${creator.username}`);
        listItem.append(spaceTitle);
        
        let spaceParticipants = $('<span>').addClass('space-participants').text(`${space.participant_count} participants`);
        listItem.append(spaceParticipants);

        let spaceLink = $('<a>')
            .attr('href', `https://twitter.com/i/spaces/${space.id}`)
            .attr('target', '_blank')
            .addClass('space-link')
            .text('Join Space');
        listItem.append(spaceLink);

        $('#resultsList').append(listItem);
    });
}
