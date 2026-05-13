export async function getEventPolls(eventId) {
  const response = await fetch(`/api/events/${eventId}/polls`);
  return await response.json();
}

export async function createPoll(eventId, pollData) {
  const response = await fetch(`/api/events/${eventId}/polls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pollData)
  });

  return await response.json();
}

export async function deletePoll(eventId, pollId) {
  const response = await fetch(`/api/events/${eventId}/polls/${pollId}`, {
    method: 'DELETE'
  });

  return await response.json();
}

export async function voteInPoll(eventId, pollId, userEmail, optionId) {
  const response = await fetch(`/api/events/${eventId}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      optionId
    })
  });

  return await response.json();
}

export async function deleteEventPolls(eventId) {
  const response = await fetch(`/api/events/${eventId}/polls`, {
    method: 'DELETE'
  });

  return await response.json();
}

export function getUserPollVote(poll, userEmail) {
  return poll?.votes?.[userEmail] || null;
}

export function getPollResults(poll) {
  const counts = {};
  const votes = poll?.votes || {};

  for (const option of poll.options || []) {
    counts[option.id] = 0;
  }

  Object.values(votes).forEach(optionId => {
    if (counts[optionId] !== undefined) {
      counts[optionId] += 1;
    }
  });

  const totalVotes = Object.keys(votes).length;

  return (poll.options || []).map(option => {
    const voteCount = counts[option.id] || 0;
    const percent = totalVotes === 0
      ? 0
      : Math.round((voteCount / totalVotes) * 100);

    return {
      optionId: option.id,
      text: option.text,
      voteCount,
      percent
    };
  });
}

export function createPollFromFormData(eventId, currentUser, { title, type, options }) {
  return {
    title,
    type,
    options
  };
}