// js/services/polls.service.js

import { getItem, setItem } from '../core/storage.js';

const EVENT_POLLS_KEY = 'eventPolls';

export function getAllPollsMap() {
  return getItem(EVENT_POLLS_KEY, {});
}

export function saveAllPollsMap(data) {
  setItem(EVENT_POLLS_KEY, data);
}

export function getEventPolls(eventId) {
  const allPolls = getAllPollsMap();
  return allPolls[eventId] || [];
}

export function saveEventPolls(eventId, polls) {
  const allPolls = getAllPollsMap();
  allPolls[eventId] = polls;
  saveAllPollsMap(allPolls);
}

export function generatePollId(eventId) {
  const polls = getEventPolls(eventId);
  if (!polls.length) return 1;
  return Math.max(...polls.map(poll => Number(poll.id))) + 1;
}

export function createPoll(eventId, pollData) {
  const polls = getEventPolls(eventId);
  polls.push(pollData);
  saveEventPolls(eventId, polls);
}

export function deletePoll(eventId, pollId) {
  const polls = getEventPolls(eventId).filter(
    poll => Number(poll.id) !== Number(pollId)
  );
  saveEventPolls(eventId, polls);
}

export function getPollById(eventId, pollId) {
  return getEventPolls(eventId).find(
    poll => Number(poll.id) === Number(pollId)
  ) || null;
}

export function voteInPoll(eventId, pollId, userEmail, optionId) {
  const polls = getEventPolls(eventId).map(poll => {
    if (Number(poll.id) !== Number(pollId)) return poll;

    return {
      ...poll,
      votes: {
        ...(poll.votes || {}),
        [userEmail]: Number(optionId)
      }
    };
  });

  saveEventPolls(eventId, polls);
}

export function removeVoteFromPoll(eventId, pollId, userEmail) {
  const polls = getEventPolls(eventId).map(poll => {
    if (Number(poll.id) !== Number(pollId)) return poll;

    const nextVotes = { ...(poll.votes || {}) };
    delete nextVotes[userEmail];

    return {
      ...poll,
      votes: nextVotes
    };
  });

  saveEventPolls(eventId, polls);
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
    const percent = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);

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
    id: generatePollId(eventId),
    title,
    type,
    createdBy: currentUser.email,
    options: options.map((text, index) => ({
      id: index + 1,
      text
    })),
    votes: {}
  };
}

export function deleteEventPolls(eventId) {
  const allPolls = getAllPollsMap();
  delete allPolls[eventId];
  saveAllPollsMap(allPolls);
}