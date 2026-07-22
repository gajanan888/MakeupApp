import validator from "validator";

const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

export const validateCreateBooking = ({ artistId, date, time }) => {
  const errors = [];

  const parsedArtistId = Number(artistId);
  if (!isPositiveInt(parsedArtistId)) {
    errors.push("artistId must be a positive integer");
  }

  if (!validator.isISO8601(String(date || ""), { strict: true })) {
    errors.push("date must be in YYYY-MM-DD format");
  }

  let timeValue = String(time || "").trim();
  const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(timeValue)) {
    const match = timeValue.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = match[2];
      const ampm = match[3] ? match[3].toUpperCase() : null;
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      timeValue = `${String(hour).padStart(2, '0')}:${min}`;
    }
  }

  if (!timeRegex.test(timeValue)) {
    errors.push("time must be in HH:MM 24h format");
  }

  return { errors, parsedArtistId };
};

export const getPagination = (page, limit) => {
  const parsedPage = Number(page) || 1;
  const parsedLimit = Number(limit) || 10;

  const safePage = parsedPage > 0 ? parsedPage : 1;
  const safeLimit = parsedLimit > 0 && parsedLimit <= 100 ? parsedLimit : 10;

  return {
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
};
