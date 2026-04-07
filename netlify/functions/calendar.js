const { supabase } = require('./_shared/supabase');

exports.handler = async () => {
  try {
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('data_matrimonio, footer_testo')
      .single();

    if (settingsError) throw settingsError;

    const { data: timeline, error: timelineError } = await supabase
      .from('timeline')
      .select('ora, titolo')
      .order('ordine', { ascending: true });

    if (timelineError) throw timelineError;

    const formatDateTime = (d) => {
      return d.getFullYear() +
        String(d.getMonth() + 1).padStart(2, '0') +
        String(d.getDate()).padStart(2, '0') + 'T' +
        String(d.getHours()).padStart(2, '0') +
        String(d.getMinutes()).padStart(2, '0') +
        String(d.getSeconds()).padStart(2, '0');
    };

    const date = new Date(settings.data_matrimonio);
    const startTime = new Date(date);
    startTime.setHours(11, 30, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0);

    const timelineDesc = timeline.map(t => `${t.ora}: ${t.titolo}`).join('\n');
    const description = timelineDesc + '\n\n' + (settings.footer_testo || '');

    const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Matrimonio Sofia & Stefano//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Matrimonio Sofia & Stefano
X-WR-TIMEZONE:Europe/Rome
BEGIN:VEVENT
UID:matrimonio-2026@sofiaestafano.it
DTSTART:${formatDateTime(startTime)}
DTEND:${formatDateTime(endTime)}
SUMMARY:Matrimonio Sofia Macchi & Stefano Bulgheroni
LOCATION:Villa Morotti, Daverio (VA) - Parcheggio
DESCRIPTION:${description.replace(/\n/g, '\\n')}
END:VEVENT
END:VCALENDAR`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="Matrimonio-Sofia-Stefano.ics"',
        'Cache-Control': 'no-cache'
      },
      body: ical
    };
  } catch (err) {
    console.error('Calendar error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
